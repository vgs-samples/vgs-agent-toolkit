import os

import stripe
from flask import (Blueprint, jsonify, redirect, render_template, request,
                   url_for)

from . import db
from .models import FormSubmission

main = Blueprint("main", __name__)

# Initialize Stripe with the secret key from environment variables
stripe.api_key = os.getenv("STRIPE_SECRET_KEY")


@main.route("/")
def index():
    return render_template("form.html")


@main.route("/api/submit", methods=["POST"])
def submit_form():
    data = request.get_json() if request.is_json else request.form

    if not data:
        return jsonify({"error": "No data provided"}), 400

    try:
        agreement = data.get("agreement") == "on"
        submission = FormSubmission(
            username=data.get("username"),
            email=data.get("email"),
            password=data.get("password"),
            agreement=agreement,
        )

        db.session.add(submission)
        db.session.commit()

        return (
            jsonify({"message": "Form submitted successfully", "id": submission.id}),
            201,
        )

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@main.route("/api/submissions", methods=["GET"])
def get_submissions():
    submissions = FormSubmission.query.all()
    return jsonify(
        [
            {
                "id": sub.id,
                "username": sub.username,
                "email": sub.email,
                "agreement": sub.agreement,
                "created_at": sub.created_at.isoformat(),
            }
            for sub in submissions
        ]
    )


@main.route("/api/create-payment-intent", methods=["POST"])
def create_payment_intent():
    try:
        data = request.get_json()
        amount = data.get("amount", 1000)  # Default to $10.00 (amount in cents)

        # Create a PaymentIntent with the order amount and currency
        intent = stripe.PaymentIntent.create(
            amount=amount,
            currency="usd",
            automatic_payment_methods={
                "enabled": True,
            },
        )

        return jsonify({"clientSecret": intent.client_secret})
    except Exception as e:
        return jsonify(error=str(e)), 403


@main.route("/payment")
def payment_page():
    return render_template(
        "payment.html", stripe_public_key=os.getenv("STRIPE_PUBLIC_KEY")
    )


@main.route("/payment-complete")
def payment_complete():
    payment_intent = request.args.get("payment_intent")
    payment_intent_client_secret = request.args.get("payment_intent_client_secret")

    details = None
    payment_method_details = None
    if payment_intent and payment_intent_client_secret:
        try:
            # Retrieve the payment intent to check its status
            intent = stripe.PaymentIntent.retrieve(payment_intent)
            details = {
                "id": intent.id,
                "amount": intent.amount / 100.0,  # convert cents to dollars
                "currency": intent.currency.upper(),
                "status": intent.status,
                "email": intent.get("receipt_email", "N/A"),
                "created": intent.created,
                "description": intent.get("description", "N/A"),
                "payment_method": intent.payment_method,
            }
            # Fetch payment method details if available
            if intent.payment_method:
                pm = stripe.PaymentMethod.retrieve(intent.payment_method)
                payment_method_details = {
                    "id": pm.id,
                    "type": pm.type,
                    "brand": pm.card.brand if pm.type == "card" else "",
                    "last4": pm.card.last4 if pm.type == "card" else "",
                    "exp_month": pm.card.exp_month if pm.type == "card" else "",
                    "exp_year": pm.card.exp_year if pm.type == "card" else "",
                }
            if intent.status == "succeeded":
                return render_template(
                    "payment_complete.html",
                    success=True,
                    message="Payment completed successfully!",
                    details=details,
                    payment_method_details=payment_method_details,
                )
            else:
                return render_template(
                    "payment_complete.html",
                    success=False,
                    message="Payment was not successful. Please try again.",
                    details=details,
                    payment_method_details=payment_method_details,
                )
        except Exception as e:
            return render_template(
                "payment_complete.html",
                success=False,
                message=f"An error occurred: {str(e)}",
                details=None,
                payment_method_details=None,
            )

    return render_template(
        "payment_complete.html",
        success=False,
        message="No payment information found.",
        details=None,
        payment_method_details=None,
    )
