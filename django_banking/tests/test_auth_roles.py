from django.test import TestCase, Client
from apps.accounts.models import User, UserRole

class RoleAuthenticationTests(TestCase):
    def setUp(self):
        self.client = Client()
        self.admin = User.objects.create_user(username='admin_test', password='password123', role=UserRole.ADMIN)
        self.staff = User.objects.create_user(username='staff_test', password='password123', role=UserRole.STAFF)
        self.customer = User.objects.create_user(username='customer_test', password='password123', role=UserRole.CUSTOMER)

    def test_customer_cannot_access_staff_customer_directory(self):
        self.client.login(username='customer_test', password='password123')
        response = self.client.get('/accounts/customers/')
        # Should be forbidden or redirected
        self.assertEqual(response.status_code, 403)

    def test_staff_can_access_customer_directory(self):
        self.client.login(username='staff_test', password='password123')
        response = self.client.get('/accounts/customers/')
        self.assertEqual(response.status_code, 200)

    def test_admin_can_access_branch_creation(self):
        self.client.login(username='admin_test', password='password123')
        response = self.client.get('/accounts/branches/add/')
        self.assertEqual(response.status_code, 200)
