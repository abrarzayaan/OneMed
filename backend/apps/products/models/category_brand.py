from django.db import models
from django.utils.text import slugify

class StatusChoices(models.TextChoices):
    ACTIVE = 'active', 'Active'
    INACTIVE = 'inactive', 'Inactive'


class Category(models.Model):
    """
    PharmaSys Product Category Model.
    Supports multi-level hierarchy (Self-referencing ForeignKey)
    """
    parent = models.ForeignKey(
        'self', 
        on_delete=models.SET_NULL, 
        null=True,
        blank=True, 
        related_name='children'
    )
    name = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255, unique=True, db_index=True)
    image = models.ImageField(upload_to='categories/images/', null=True, blank=True)
    icon = models.ImageField(upload_to='categories/icons/', null=True, blank=True)
    sort_order = models.PositiveIntegerField(default=0)
    status = models.CharField(
        max_length=20, 
        choices=StatusChoices.choices, 
        default=StatusChoices.ACTIVE
    )
    
    # Flexible Meta: { "show_on_homepage": true, "seo_title": "", "seo_description": "" }
    metadata = models.JSONField(default=dict, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'ph_categories'  # Clean table prefix naming convention
        verbose_name_plural = "Categories"
        ordering = ['sort_order', 'name']

    def __str__(self):
        return f"{self.parent.name} -> {self.name}" if self.parent else self.name


class Brand(models.Model):
    """
    PharmaSys Product Brand / Manufacturer Model.
    """
    name = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255, unique=True, db_index=True)
    logo = models.ImageField(upload_to='brands/logos/', null=True, blank=True)
    status = models.CharField(
        max_length=20, 
        choices=StatusChoices.choices, 
        default=StatusChoices.ACTIVE
    )
    
    # Flexible Meta: { "country_origin": "", "website": "" }
    metadata = models.JSONField(default=dict, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'ph_brands'
        ordering = ['name']

    def __str__(self):
        return self.name