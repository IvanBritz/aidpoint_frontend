export const metadata = {
  title: 'About | AidPoint',
}

import TopNav from '@/components/TopNav'

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
      <TopNav />
      <section className="max-w-6xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="mb-16">
          <h1 className="text-4xl md:text-5xl font-extrabold text-blue-950 mb-6">About AidPoint</h1>
          <p className="text-lg text-blue-900/80 max-w-3xl leading-relaxed">
            AidPoint is a comprehensive financial aid management platform designed to streamline the complete lifecycle of aid programs—from beneficiary registration to fund disbursement and accountability reporting.
          </p>
        </div>

        {/* Main Purpose Section */}
        <div className="mb-16 bg-white rounded-2xl p-8 ring-1 ring-blue-100 shadow-sm">
          <h2 className="text-2xl font-bold text-blue-950 mb-6">Main Purpose</h2>
          <p className="text-blue-900/80 mb-4 leading-relaxed">
            AidPoint centralizes the management of financial assistance programs for multiple facilities and beneficiaries. The system ensures efficient program administration, maintains data security, and provides transparent tracking of funds from request to final accounting.
          </p>
          <p className="text-blue-900/80 leading-relaxed">
            By automating workflows and enforcing role-based controls, AidPoint reduces administrative burden, minimizes errors, and ensures compliance with financial aid distribution protocols.
          </p>
        </div>

        {/* Key Functions Section */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-blue-950 mb-8">Key Functions & Features</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Column 1 */}
            <div className="bg-white rounded-xl p-6 ring-1 ring-blue-100 shadow-sm">
              <h3 className="font-bold text-blue-950 mb-4">Beneficiary Management</h3>
              <ul className="space-y-3 text-sm text-blue-900/80">
                <li className="flex items-start">
                  <span className="font-bold mr-2">•</span>
                  <span>Register and track beneficiaries across facilities</span>
                </li>
                <li className="flex items-start">
                  <span className="font-bold mr-2">•</span>
                  <span>Assign caseworkers for personalized case management</span>
                </li>
                <li className="flex items-start">
                  <span className="font-bold mr-2">•</span>
                  <span>Track attendance and program participation</span>
                </li>
                <li className="flex items-start">
                  <span className="font-bold mr-2">•</span>
                  <span>Manage beneficiary documents and submissions</span>
                </li>
              </ul>
            </div>

            {/* Column 2 */}
            <div className="bg-white rounded-xl p-6 ring-1 ring-blue-100 shadow-sm">
              <h3 className="font-bold text-blue-950 mb-4">Aid Request Workflow</h3>
              <ul className="space-y-3 text-sm text-blue-900/80">
                <li className="flex items-start">
                  <span className="font-bold mr-2">•</span>
                  <span>Submit aid requests through streamlined forms</span>
                </li>
                <li className="flex items-start">
                  <span className="font-bold mr-2">•</span>
                  <span>Multi-level approval workflow (Caseworker → Finance → Director)</span>
                </li>
                <li className="flex items-start">
                  <span className="font-bold mr-2">•</span>
                  <span>Calculate COLA (Cost of Living Adjustment) amounts automatically</span>
                </li>
                <li className="flex items-start">
                  <span className="font-bold mr-2">•</span>
                  <span>Track request status in real-time</span>
                </li>
              </ul>
            </div>

            {/* Column 3 */}
            <div className="bg-white rounded-xl p-6 ring-1 ring-blue-100 shadow-sm">
              <h3 className="font-bold text-blue-950 mb-4">Fund Disbursement</h3>
              <ul className="space-y-3 text-sm text-blue-900/80">
                <li className="flex items-start">
                  <span className="font-bold mr-2">•</span>
                  <span>Finance team manages fund distribution to caseworkers</span>
                </li>
                <li className="flex items-start">
                  <span className="font-bold mr-2">•</span>
                  <span>Caseworkers track received and disbursed amounts</span>
                </li>
                <li className="flex items-start">
                  <span className="font-bold mr-2">•</span>
                  <span>Beneficiaries receive aid through verified channels</span>
                </li>
                <li className="flex items-start">
                  <span className="font-bold mr-2">•</span>
                  <span>Maintain complete disbursement audit trail</span>
                </li>
              </ul>
            </div>

            {/* Column 4 */}
            <div className="bg-white rounded-xl p-6 ring-1 ring-blue-100 shadow-sm">
              <h3 className="font-bold text-blue-950 mb-4">Liquidation & Reporting</h3>
              <ul className="space-y-3 text-sm text-blue-900/80">
                <li className="flex items-start">
                  <span className="font-bold mr-2">•</span>
                  <span>Beneficiaries submit liquidation reports with receipts</span>
                </li>
                <li className="flex items-start">
                  <span className="font-bold mr-2">•</span>
                  <span>Multi-level approval of liquidations (Caseworker → Finance → Director)</span>
                </li>
                <li className="flex items-start">
                  <span className="font-bold mr-2">•</span>
                  <span>Generate comprehensive analytics and fund reports</span>
                </li>
                <li className="flex items-start">
                  <span className="font-bold mr-2">•</span>
                  <span>Download summary PDFs and transaction histories</span>
                </li>
              </ul>
            </div>

            {/* Column 5 */}
            <div className="bg-white rounded-xl p-6 ring-1 ring-blue-100 shadow-sm">
              <h3 className="font-bold text-blue-950 mb-4">Security & Access Control</h3>
              <ul className="space-y-3 text-sm text-blue-900/80">
                <li className="flex items-start">
                  <span className="font-bold mr-2">•</span>
                  <span>Role-based access control (Director, Caseworker, Finance)</span>
                </li>
                <li className="flex items-start">
                  <span className="font-bold mr-2">•</span>
                  <span>Privilege-based permissions for sensitive operations</span>
                </li>
                <li className="flex items-start">
                  <span className="font-bold mr-2">•</span>
                  <span>Comprehensive audit logging of all transactions</span>
                </li>
                <li className="flex items-start">
                  <span className="font-bold mr-2">•</span>
                  <span>Secure authentication and session management</span>
                </li>
              </ul>
            </div>

            {/* Column 6 */}
            <div className="bg-white rounded-xl p-6 ring-1 ring-blue-100 shadow-sm">
              <h3 className="font-bold text-blue-950 mb-4">Administrative Tools</h3>
              <ul className="space-y-3 text-sm text-blue-900/80">
                <li className="flex items-start">
                  <span className="font-bold mr-2">•</span>
                  <span>Manage multiple facilities and staff assignments</span>
                </li>
                <li className="flex items-start">
                  <span className="font-bold mr-2">•</span>
                  <span>Configure subscription plans and service limits</span>
                </li>
                <li className="flex items-start">
                  <span className="font-bold mr-2">•</span>
                  <span>Real-time dashboards and performance analytics</span>
                </li>
                <li className="flex items-start">
                  <span className="font-bold mr-2">•</span>
                  <span>Notification and feedback management</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Who Benefits Section */}
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-2xl p-8 ring-1 ring-blue-100 mb-16">
          <h2 className="text-2xl font-bold text-blue-950 mb-8">Who Benefits from AidPoint?</h2>
          <div className="grid md:grid-cols-4 gap-6">
            {/* Beneficiary */}
            <div className="bg-white rounded-xl p-6 shadow-sm ring-1 ring-blue-50">
              <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-blue-100 mb-4">
                <span className="text-xl">👥</span>
              </div>
              <h3 className="font-bold text-blue-950 mb-3">Beneficiaries</h3>
              <p className="text-sm text-blue-900/80 leading-relaxed">
                Receive streamlined access to submit aid requests, track disbursements, submit liquidation reports, and monitor their case progress through an intuitive portal.
              </p>
            </div>

            {/* Caseworker */}
            <div className="bg-white rounded-xl p-6 shadow-sm ring-1 ring-blue-50">
              <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-green-100 mb-4">
                <span className="text-xl">💼</span>
              </div>
              <h3 className="font-bold text-blue-950 mb-3">Caseworkers</h3>
              <p className="text-sm text-blue-900/80 leading-relaxed">
                Manage assigned beneficiaries, review aid requests, coordinate fund disbursements, track attendance, and oversee liquidation documentation with dedicated dashboards.
              </p>
            </div>

            {/* Finance Team */}
            <div className="bg-white rounded-xl p-6 shadow-sm ring-1 ring-blue-50">
              <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-yellow-100 mb-4">
                <span className="text-xl">💰</span>
              </div>
              <h3 className="font-bold text-blue-950 mb-3">Finance Team</h3>
              <p className="text-sm text-blue-900/80 leading-relaxed">
                Approve aid requests, manage fund allocations, process disbursements, approve liquidations, and generate financial reports with audit trails.
              </p>
            </div>

            {/* Directors */}
            <div className="bg-white rounded-xl p-6 shadow-sm ring-1 ring-blue-50">
              <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-purple-100 mb-4">
                <span className="text-xl">📊</span>
              </div>
              <h3 className="font-bold text-blue-950 mb-3">Directors</h3>
              <p className="text-sm text-blue-900/80 leading-relaxed">
                Oversee all operations, approve high-level requests and liquidations, access facility-wide analytics, manage staff, and ensure program compliance.
              </p>
            </div>
          </div>
        </div>

        {/* Technical Foundation */}
        <div className="bg-white rounded-2xl p-8 ring-1 ring-blue-100 shadow-sm">
          <h2 className="text-2xl font-bold text-blue-950 mb-6">Built for Reliability</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-bold text-blue-950 mb-3">Technology Stack</h3>
              <ul className="space-y-2 text-sm text-blue-900/80">
                <li className="flex items-center"><span className="text-blue-500 font-bold mr-2">→</span>Modern Next.js frontend for responsive UI</li>
                <li className="flex items-center"><span className="text-blue-500 font-bold mr-2">→</span>Python FastAPI backend for performance</li>
                <li className="flex items-center"><span className="text-blue-500 font-bold mr-2">→</span>Laravel API for subscription & payment handling</li>
                <li className="flex items-center"><span className="text-blue-500 font-bold mr-2">→</span>Tailwind CSS for consistent design</li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-blue-950 mb-3">Core Capabilities</h3>
              <ul className="space-y-2 text-sm text-blue-900/80">
                <li className="flex items-center"><span className="text-blue-500 font-bold mr-2">→</span>Real-time notifications and updates</li>
                <li className="flex items-center"><span className="text-blue-500 font-bold mr-2">→</span>Complete audit logging and compliance</li>
                <li className="flex items-center"><span className="text-blue-500 font-bold mr-2">→</span>Flexible subscription & billing management</li>
                <li className="flex items-center"><span className="text-blue-500 font-bold mr-2">→</span>Advanced analytics and reporting</li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
