import { Card, CardContent, CardHeader } from '@/components/ui/Card'

export function Terms() {
  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold text-slate-900">Terms & Conditions</h1>
      <Card>
        <CardHeader>
          <h2 className="font-semibold text-slate-900">1. Acceptance</h2>
        </CardHeader>
        <CardContent className="prose prose-slate max-w-none">
          <p>
            By accessing or using ScopeLedger (&quot;Service&quot;), you agree to be bound by these Terms and Conditions.
            If you do not agree, do not use the Service.
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <h2 className="font-semibold text-slate-900">2. Description of Service</h2>
        </CardHeader>
        <CardContent className="prose prose-slate max-w-none">
          <p>
            The Service provides project budgeting, cost tracking, change-order management, and forecasting tools.
            AI-powered features are advisory only and do not modify your data without your explicit action.
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <h2 className="font-semibold text-slate-900">3. Your Responsibilities</h2>
        </CardHeader>
        <CardContent className="prose prose-slate max-w-none">
          <p>
            You are responsible for the accuracy of data you enter and for maintaining the confidentiality of your account.
            You must not use the Service for any unlawful purpose or in violation of these Terms.
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <h2 className="font-semibold text-slate-900">4. Disclaimer</h2>
        </CardHeader>
        <CardContent className="prose prose-slate max-w-none">
          <p>
            The Service is provided &quot;as is.&quot; We do not guarantee uninterrupted or error-free operation.
            Financial or project decisions based on the Service are your sole responsibility.
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <h2 className="font-semibold text-slate-900">5. Limitation of Liability</h2>
        </CardHeader>
        <CardContent className="prose prose-slate max-w-none">
          <p>
            To the fullest extent permitted by law, we shall not be liable for any indirect, incidental, special,
            or consequential damages arising from your use of the Service.
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <h2 className="font-semibold text-slate-900">6. Changes</h2>
        </CardHeader>
        <CardContent className="prose prose-slate max-w-none">
          <p>
            We may update these Terms from time to time. Continued use of the Service after changes constitutes
            acceptance of the revised Terms.
          </p>
        </CardContent>
      </Card>
      <p className="text-sm text-slate-500">
        Last updated: January 2025. For questions, contact the service operator.
      </p>
    </div>
  )
}
