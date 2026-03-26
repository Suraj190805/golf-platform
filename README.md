⛳ Golf Charity Platform

A full-stack web application that combines golf, charity, and rewards, allowing users to participate in monthly draws, contribute to causes, and track their performance.

⸻

🚀 Live Demo

👉 https://golf-platform-iota.vercel.app

⸻

🔐 Demo Credentials

👤 Demo User  

	•	Email: demo@golfcharity.com
	•	Password: Demo@123

🛠️ Admin Access  

	•	Email: admin@golfcharity.com
	•	Password: admin123

⸻

✨ Features  

	•	🧾 User Authentication (Signup/Login)
	•	💳 Subscription System (Stripe Integration)
	•	🏌️ Score Submission & Tracking
	•	🎯 Monthly Prize Draw System
	•	❤️ Charity Selection & Donations
	•	📊 User Dashboard
	•	🛠️ Admin Panel (manage users, draws, charities)

⸻

🧱 Tech Stack  

	•	Frontend: Next.js (App Router)
	•	Backend: Supabase (Database + Auth)
	•	Payments: Stripe
	•	Emails: Resend
	•	Deployment: Vercel

⸻

⚙️ Environment Variables

Create a .env.local file and add:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

STRIPE_SECRET_KEY=your_stripe_secret
STRIPE_WEBHOOK_SECRET=your_webhook_secret
STRIPE_MONTHLY_PRICE_ID=your_price_id
STRIPE_YEARLY_PRICE_ID=your_price_id

RESEND_API_KEY=your_resend_key

NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

⸻

📦 Installation

```
git clone https://github.com/your-username/golf-platform.git
cd golf-platform
npm install
npm run dev
```

⸻

🧠 How It Works  

	1.	Users subscribe to the platform
	2.	Submit golf scores
	3.	Participate in monthly draws
	4.	Winners are selected
	5.	A portion of funds goes to selected charities

⸻

📁 Project Structure

```
app/
  auth/
  dashboard/
  donate/
  draws/
  subscribe/

lib/
  supabaseClient.js
  supabaseServer.js
  email.js
```

⸻

🛡️ Notes  

	•	Database is clean and production-ready
	•	Only essential demo and admin users are included
	•	Environment variables are secured and not exposed

⸻

👨‍💻 Author  
```
Suraj S
Email : suraj28238@gmail.com
```
____
