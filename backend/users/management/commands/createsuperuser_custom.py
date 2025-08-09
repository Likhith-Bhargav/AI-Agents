from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

User = get_user_model()

class Command(BaseCommand):
    help = 'Create a superuser with the required fields for the custom user model'

    def handle(self, *args, **options):
        if not User.objects.filter(email='admin@example.com').exists():
            User.objects.create_superuser(
                email='admin@example.com',
                password='admin123',
                first_name='Admin',
                last_name='User',
                role='ADMIN',
                is_staff=True,
                is_superuser=True,
                is_active=True
            )
            self.stdout.write(self.style.SUCCESS('Successfully created superuser'))
        else:
            self.stdout.write(self.style.WARNING('Superuser already exists'))
