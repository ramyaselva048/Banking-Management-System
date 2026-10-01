from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth import login, logout, update_session_auth_hash
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.core.paginator import Paginator
from django.db.models import Q
from django.db import transaction
from .models import User, CustomerProfile, Branch, UserRole, KYCStatus
from .forms import UserLoginForm, CustomerRegistrationForm, CustomerManagementForm, BranchForm
from .decorators import staff_required, admin_required
from apps.core.models import AuditLog, Notification

def login_view(request):
    if request.user.is_authenticated:
        return redirect('core:dashboard')
    
    if request.method == 'POST':
        form = UserLoginForm(request.POST)
        if form.is_valid():
            user = form.cleaned_data['user']
            login(request, user)
            AuditLog.log(
                user=user,
                action='LOGIN',
                description=f"User {user.username} logged in successfully.",
                ip_address=request.META.get('REMOTE_ADDR')
            )
            messages.success(request, f"Welcome back, {user.get_full_name() or user.username}!")
            next_url = request.GET.get('next')
            return redirect(next_url if next_url else 'core:dashboard')
        else:
            messages.error(request, "Authentication failed. Please verify credentials.")
    else:
        form = UserLoginForm()
    
    return render(request, 'auth/login.html', {'form': form})


def logout_view(request):
    if request.user.is_authenticated:
        AuditLog.log(
            user=request.user,
            action='LOGOUT',
            description=f"User {request.user.username} logged out.",
            ip_address=request.META.get('REMOTE_ADDR')
        )
        logout(request)
        messages.info(request, "You have been securely signed out.")
    return redirect('accounts:login')


def register_view(request):
    if request.user.is_authenticated:
        return redirect('core:dashboard')

    if request.method == 'POST':
        form = CustomerRegistrationForm(request.POST)
        if form.is_valid():
            with transaction.atomic():
                user = form.save(commit=False)
                user.set_password(form.cleaned_data['password'])
                user.role = UserRole.CUSTOMER
                user.save()

                CustomerProfile.objects.create(
                    user=user,
                    branch=form.cleaned_data.get('branch'),
                    date_of_birth=form.cleaned_data.get('date_of_birth'),
                    id_number=form.cleaned_data.get('id_number', ''),
                    address=form.cleaned_data.get('address', ''),
                    kyc_status=KYCStatus.PENDING
                )

                Notification.send(
                    user=user,
                    title="Account Registered",
                    message="Welcome to Apex Bank! Your customer registration has been initialized. Visit branch or upload KYC to unlock full privileges."
                )

                login(request, user)
                messages.success(request, "Registration successful! Welcome to Apex Bank.")
                return redirect('core:dashboard')
        else:
            messages.error(request, "Please review form errors below.")
    else:
        form = CustomerRegistrationForm()

    return render(request, 'auth/register.html', {'form': form})


@login_required
@staff_required
def customer_list_view(request):
    query = request.GET.get('q', '').strip()
    kyc_filter = request.GET.get('kyc', '')
    branch_filter = request.GET.get('branch', '')

    customers = CustomerProfile.objects.select_related('user', 'branch').all().order_by('-created_at')

    if query:
        customers = customers.filter(
            Q(user__first_name__icontains=query) |
            Q(user__last_name__icontains=query) |
            Q(user__email__icontains=query) |
            Q(user__phone_number__icontains=query) |
            Q(customer_id__icontains=query)
        )
    if kyc_filter:
        customers = customers.filter(kyc_status=kyc_filter)
    if branch_filter:
        customers = customers.filter(branch_id=branch_filter)

    paginator = Paginator(customers, 10)
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)

    branches = Branch.objects.filter(is_active=True)
    return render(request, 'customers/customer_list.html', {
        'page_obj': page_obj,
        'query': query,
        'kyc_filter': kyc_filter,
        'branch_filter': branch_filter,
        'branches': branches,
        'kyc_choices': KYCStatus.choices,
    })


@login_required
@staff_required
def customer_detail_view(request, pk):
    customer = get_object_or_404(CustomerProfile.objects.select_related('user', 'branch'), pk=pk)
    accounts = customer.accounts.all()
    loans = customer.loans.all()
    return render(request, 'customers/customer_detail.html', {
        'customer': customer,
        'accounts': accounts,
        'loans': loans
    })


@login_required
@staff_required
def customer_create_view(request):
    if request.method == 'POST':
        form = CustomerManagementForm(request.POST)
        username = request.POST.get('username')
        password = request.POST.get('password')
        if not username or not password:
            messages.error(request, "Username and temporary password are required.")
            return render(request, 'customers/customer_form.html', {'form': form, 'is_create': True})

        if User.objects.filter(username=username).exists():
            messages.error(request, "A user with this username already exists.")
            return render(request, 'customers/customer_form.html', {'form': form, 'is_create': True})

        if form.is_valid():
            with transaction.atomic():
                user = User.objects.create_user(
                    username=username,
                    password=password,
                    first_name=form.cleaned_data['first_name'],
                    last_name=form.cleaned_data['last_name'],
                    email=form.cleaned_data['email'],
                    phone_number=form.cleaned_data.get('phone_number', ''),
                    role=UserRole.CUSTOMER
                )
                profile = form.save(commit=False)
                profile.user = user
                profile.save()

                AuditLog.log(
                    user=request.user,
                    action='CREATE_CUSTOMER',
                    description=f"Created customer profile {profile.customer_id} for {user.username}.",
                    ip_address=request.META.get('REMOTE_ADDR')
                )
                messages.success(request, f"Customer {user.get_full_name()} created successfully!")
                return redirect('accounts:customer_detail', pk=profile.pk)
    else:
        form = CustomerManagementForm()
    return render(request, 'customers/customer_form.html', {'form': form, 'is_create': True})


@login_required
@staff_required
def customer_update_view(request, pk):
    profile = get_object_or_404(CustomerProfile, pk=pk)
    if request.method == 'POST':
        form = CustomerManagementForm(request.POST, instance=profile)
        if form.is_valid():
            with transaction.atomic():
                user = profile.user
                user.first_name = form.cleaned_data['first_name']
                user.last_name = form.cleaned_data['last_name']
                user.email = form.cleaned_data['email']
                user.phone_number = form.cleaned_data.get('phone_number', '')
                user.save()
                form.save()

                AuditLog.log(
                    user=request.user,
                    action='UPDATE_CUSTOMER',
                    description=f"Updated customer profile {profile.customer_id}.",
                    ip_address=request.META.get('REMOTE_ADDR')
                )
                messages.success(request, "Customer record updated successfully.")
                return redirect('accounts:customer_detail', pk=profile.pk)
    else:
        form = CustomerManagementForm(instance=profile, initial={
            'first_name': profile.user.first_name,
            'last_name': profile.user.last_name,
            'email': profile.user.email,
            'phone_number': profile.user.phone_number,
        })
    return render(request, 'customers/customer_form.html', {'form': form, 'profile': profile, 'is_create': False})


@login_required
@admin_required
def customer_delete_view(request, pk):
    profile = get_object_or_404(CustomerProfile, pk=pk)
    if request.method == 'POST':
        customer_name = profile.user.get_full_name()
        user = profile.user
        AuditLog.log(
            user=request.user,
            action='DELETE_CUSTOMER',
            description=f"Deleted customer {customer_name} ({profile.customer_id}).",
            ip_address=request.META.get('REMOTE_ADDR')
        )
        user.delete()
        messages.success(request, f"Customer {customer_name} was deleted permanently.")
        return redirect('accounts:customer_list')
    return render(request, 'customers/customer_confirm_delete.html', {'profile': profile})


@login_required
def profile_view(request):
    user = request.user
    if request.method == 'POST':
        user.first_name = request.POST.get('first_name', user.first_name)
        user.last_name = request.POST.get('last_name', user.last_name)
        user.email = request.POST.get('email', user.email)
        user.phone_number = request.POST.get('phone_number', user.phone_number)
        
        new_password = request.POST.get('new_password')
        if new_password:
            user.set_password(new_password)
            update_session_auth_hash(request, user)
        
        user.save()
        messages.success(request, "Profile updated successfully.")
        return redirect('accounts:profile')
    return render(request, 'core/profile.html', {'user': user})


@login_required
def branch_list_view(request):
    branches = Branch.objects.all().order_by('branch_code')
    return render(request, 'branches/branch_list.html', {'branches': branches})


@login_required
@admin_required
def branch_create_view(request):
    if request.method == 'POST':
        form = BranchForm(request.POST)
        if form.is_valid():
            branch = form.save()
            AuditLog.log(
                user=request.user,
                action='CREATE_BRANCH',
                description=f"Created bank branch {branch.name} ({branch.branch_code}).",
                ip_address=request.META.get('REMOTE_ADDR')
            )
            messages.success(request, f"Branch {branch.name} registered.")
            return redirect('accounts:branch_list')
    else:
        form = BranchForm()
    return render(request, 'branches/branch_form.html', {'form': form, 'is_create': True})


@login_required
@admin_required
def branch_update_view(request, pk):
    branch = get_object_or_404(Branch, pk=pk)
    if request.method == 'POST':
        form = BranchForm(request.POST, instance=branch)
        if form.is_valid():
            form.save()
            messages.success(request, f"Branch {branch.name} updated.")
            return redirect('accounts:branch_list')
    else:
        form = BranchForm(instance=branch)
    return render(request, 'branches/branch_form.html', {'form': form, 'branch': branch, 'is_create': False})
