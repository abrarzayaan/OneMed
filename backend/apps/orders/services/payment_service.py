from django.db import transaction
from django.utils import timezone

from apps.orders.choices import PaymentStatus
from apps.orders.models import Payment


class PaymentService:

    @classmethod
    @transaction.atomic
    def create_payment(cls, order):
        """
        Create payment record immediately after Order creation.
        """

        return Payment.objects.create(
            order=order,
            method=order.payment_method,
            amount=order.grand_total,
            status=PaymentStatus.PENDING,
        )

    @classmethod
    @transaction.atomic
    def complete_payment(
        cls,
        payment,
        transaction_id=None,
        gateway_response=None,
    ):
        """
        Mark payment as completed.
        """

        payment.status = PaymentStatus.PAID
        payment.transaction_id = transaction_id
        payment.gateway_response = gateway_response
        payment.paid_at = timezone.now()

        payment.save(
            update_fields=[
                "status",
                "transaction_id",
                "gateway_response",
                "paid_at",
                "updated_at",
            ]
        )

        order = payment.order
        order.payment_status = PaymentStatus.PAID

        order.save(
            update_fields=[
                "payment_status",
                "updated_at",
            ]
        )

        return payment

    @classmethod
    @transaction.atomic
    def fail_payment(
        cls,
        payment,
        gateway_response=None,
    ):
        """
        Mark payment as failed.
        """

        payment.status = PaymentStatus.FAILED
        payment.gateway_response = gateway_response

        payment.save(
            update_fields=[
                "status",
                "gateway_response",
                "updated_at",
            ]
        )

        order = payment.order
        order.payment_status = PaymentStatus.FAILED

        order.save(
            update_fields=[
                "payment_status",
                "updated_at",
            ]
        )

        return payment

    @classmethod
    @transaction.atomic
    def refund(
        cls,
        payment,
        gateway_response=None,
    ):
        """
        Mark payment as refunded.
        """

        payment.status = PaymentStatus.REFUNDED
        payment.gateway_response = gateway_response

        payment.save(
            update_fields=[
                "status",
                "gateway_response",
                "updated_at",
            ]
        )

        order = payment.order
        order.payment_status = PaymentStatus.REFUNDED

        order.save(
            update_fields=[
                "payment_status",
                "updated_at",
            ]
        )

        return payment