# MediCore Patient Management System

MediCore is a patient management application with a React frontend, NestJS API, and PostgreSQL database.

## Deploy a demo to Render

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/Ajay-h03/patient)

1. Select **Deploy to Render** and sign in to Render.
2. Review the services in the Blueprint and apply it.
3. Wait for the API, frontend, and database to finish deploying. Render will show the frontend URL on the static site's page.
4. Open that URL to use the app.

The Blueprint uses Render's free web-service and PostgreSQL plans. Free PostgreSQL databases expire after 30 days, and free web services can spin down when idle. This setup is for demos only; do not enter real patient information. Use a paid, appropriately secured deployment for persistent or sensitive data.

Razorpay credentials are not included. To enable payments, configure test-mode `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` in the API service's Render environment settings.

## Local development

See the example environment files in `backend/.env.example` and `frontend/.env.example`. Install dependencies and follow the root package scripts to start the database, API, and frontend locally.
