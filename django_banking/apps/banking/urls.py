from django.urls import path
from . import views

app_name = 'banking'

urlpatterns = [
    path('accounts/', views.account_list_view, name='account_list'),
    path('accounts/create/', views.account_create_view, name='account_create'),
    path('accounts/<int:pk>/', views.account_detail_view, name='account_detail'),
    path('deposit/', views.deposit_view, name='deposit'),
    path('withdraw/', views.withdrawal_view, name='withdraw'),
    path('transfer/', views.transfer_view, name='transfer'),
    path('transactions/', views.transaction_history_view, name='transactions'),
    path('statement/', views.statement_view, name='statement'),
    
    # Beneficiaries
    path('beneficiaries/', views.beneficiary_list_view, name='beneficiary_list'),
    path('beneficiaries/add/', views.beneficiary_create_view, name='beneficiary_create'),
    path('beneficiaries/<int:pk>/delete/', views.beneficiary_delete_view, name='beneficiary_delete'),
]
