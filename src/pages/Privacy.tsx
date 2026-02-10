import { Card, CardContent, CardHeader } from '@/components/ui/Card'

export function Privacy() {
  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold text-slate-900">Privacy Policy</h1>
      <Card>
        <CardHeader>
          <h2 className="font-semibold text-slate-900">1. Information We Collect</h2>
        </CardHeader>
        <CardContent className="prose prose-slate max-w-none">
          <p>
            We collect information you provide when signing up (e.g. email, display name) and when using the Service
            (e.g. project and cost data). Authentication is handled by Firebase; we do not store passwords.
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <h2 className="font-semibold text-slate-900">2. How We Use It</h2>
        </CardHeader>
        <CardContent className="prose prose-slate max-w-none">
          <p>
            We use your data to operate the Service, send transactional emails (e.g. welcome, password reset),
            and to improve our product. We do not sell your personal information.
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <h2 className="font-semibold text-slate-900">3. Data Storage & Security</h2>
        </CardHeader>
        <CardContent className="prose prose-slate max-w-none">
          <p>
            Data is stored in Firebase (Firestore). We use industry-standard practices to protect your data.
            You can delete your account and associated data by contacting us.
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <h2 className="font-semibold text-slate-900">4. Third Parties</h2>
        </CardHeader>
        <CardContent className="prose prose-slate max-w-none">
          <p>
            We use Firebase (Google) for auth and database, Postmark for email, and Google Gemini for AI features.
            Each has its own privacy policy. We do not share your data with other third parties for marketing.
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <h2 className="font-semibold text-slate-900">5. Your Rights</h2>
        </CardHeader>
        <CardContent className="prose prose-slate max-w-none">
          <p>
            You may access, correct, or delete your data through the Service or by contacting us.
            You may also opt out of non-essential emails.
          </p>
        </CardContent>
      </Card>
      <p className="text-sm text-slate-500">
        Last updated: January 2025. For questions, contact the service operator.
      </p>
    </div>
  )
}
