from django.urls import path
from . import views

app_name = 'loans'

urlpatterns = [
    path('', views.loan_list_view, name='loan_list'),
    path('apply/', views.loan_apply_view, name='loan_apply'),
    path('<int:pk>/', views.loan_detail_view, name='loan_detail'),
    path('<int:pk>/approve/', views.loan_approve_view, name='loan_approve'),
    path('<int:pk>/reject/', views.loan_reject_view, name='loan_reject'),
    path('<int:pk>/disburse/', views.loan_disburse_view, name='loan_disburse'),
    path('<int:pk>/repay/', views.loan_repay_view, name='loan_repay'),
]
