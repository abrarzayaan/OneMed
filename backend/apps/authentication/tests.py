from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from .models import Users, SystemSetting, SecurityAuditLog

class WhatsAppSettingsApiTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.url = '/api/settings/whatsapp/'

        # Super Admin User
        self.superadmin = Users.objects.create_superuser(
            phone_number='01334317864',
            email='superadmin@onemed.com',
            username='superadmin',
            password='Password123!'
        )

        # Regular Consumer/Staff User (Not Super Admin)
        self.regular_user = Users.objects.create_user(
            phone_number='01711111111',
            email='regular@onemed.com',
            username='regularuser',
            password='Password123!'
        )

    def test_public_get_whatsapp_settings(self):
        """Public users can view active WhatsApp support settings."""
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('whatsapp_support_number', response.data)
        self.assertIn('whatsapp_link', response.data)
        self.assertIn('is_whatsapp_enabled', response.data)
        self.assertTrue(response.data['whatsapp_link'].startswith('https://wa.me/'))

    def test_anonymous_cannot_update_settings(self):
        """Unauthenticated requests to update settings are rejected with 401."""
        response = self.client.patch(self.url, {'whatsapp_support_number': '+880 1888-000000'})
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_regular_user_cannot_update_settings(self):
        """Authenticated non-superadmin users are forbidden from updating settings (403)."""
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.patch(self.url, {'whatsapp_support_number': '+880 1888-000000'})
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_superadmin_can_update_settings(self):
        """Super Admin can successfully update WhatsApp support settings."""
        self.client.force_authenticate(user=self.superadmin)
        payload = {
            'whatsapp_support_number': '+880 1999-888777',
            'whatsapp_default_message': 'Urgent medicine inquiry for OneMed Pharmacist.',
            'is_whatsapp_enabled': True
        }
        response = self.client.patch(self.url, payload)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['whatsapp_support_number'], '+880 1999-888777')
        self.assertIn('8801999888777', response.data['whatsapp_link'])

        # Verify DB persistence
        setting = SystemSetting.get_settings()
        self.assertEqual(setting.whatsapp_support_number, '+880 1999-888777')

        # Verify security audit log was written
        audit_log = SecurityAuditLog.objects.filter(module='SYSTEM_SETTINGS').first()
        self.assertIsNotNone(audit_log)
        self.assertIn('+880 1999-888777', audit_log.description)
