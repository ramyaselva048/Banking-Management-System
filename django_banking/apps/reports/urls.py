from django.urls import path
from . import views

app_name = 'reports'

urlpatterns = [
    path('export/transactions/', views.export_transactions_excel, name='export_transactions_excel'),
    path('export/customers/', views.export_customers_excel, name='export_customers_excel'),
    path('statement/<int:account_id>/pdf/', views.export_statement_pdf, name='export_statement_pdf'),
]
