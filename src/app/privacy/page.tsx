import Link from 'next/link';
import { Shield, ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'Privacy Policy - NIH Grant Master',
  description: 'Privacy Policy for NIH Grant Master NIH SBIR/STTR Grant Authoring Platform',
};

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Link
          href="/"
          className="inline-flex items-center text-indigo-600 hover:text-indigo-700 mb-8"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Link>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 md:p-12">
          <div className="flex items-center mb-8">
            <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center mr-4">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Privacy Policy</h1>
              <p className="text-slate-500 text-sm">Last updated: January 28, 2026</p>
            </div>
          </div>

          <div className="prose prose-slate max-w-none">
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">1. Data Collection</h2>
              <p className="text-slate-600 leading-relaxed mb-4">
                We collect information that you provide directly to us when using NIH Grant Master:
              </p>
              <ul className="list-disc pl-6 text-slate-600 space-y-2">
                <li>
                  <strong>Account Information:</strong> Name, email address, organization, and role
                </li>
                <li>
                  <strong>Grant Content:</strong> Documents, research data, and application materials
                  you create or upload
                </li>
                <li>
                  <strong>Usage Data:</strong> Features used, time spent, and interaction patterns
                </li>
                <li>
                  <strong>Technical Data:</strong> IP address, browser type, device information, and
                  cookies
                </li>
                <li>
                  <strong>Communication Data:</strong> Support requests and feedback you submit
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">2. Data Usage</h2>
              <p className="text-slate-600 leading-relaxed mb-4">
                We use collected information for the following purposes:
              </p>
              <ul className="list-disc pl-6 text-slate-600 space-y-2">
                <li>Providing, maintaining, and improving the Service</li>
                <li>Processing and storing your grant documents securely</li>
                <li>Enabling AI-assisted writing features</li>
                <li>Sending service updates and notifications</li>
                <li>Responding to support requests</li>
                <li>Analyzing usage patterns to improve user experience</li>
                <li>Ensuring security and preventing fraud</li>
                <li>Complying with legal obligations</li>
              </ul>
              <p className="text-slate-600 leading-relaxed mt-4">
                <strong>Important:</strong> We do not sell your personal information or grant content
                to third parties. Your research data remains confidential.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">3. Data Storage and Security</h2>
              <p className="text-slate-600 leading-relaxed mb-4">
                We implement robust security measures to protect your data:
              </p>
              <ul className="list-disc pl-6 text-slate-600 space-y-2">
                <li>All data is encrypted in transit using TLS 1.3</li>
                <li>Data at rest is encrypted using AES-256 encryption</li>
                <li>Access controls limit data access to authorized personnel only</li>
                <li>Regular security audits and penetration testing</li>
                <li>Data is stored in SOC 2 compliant data centers</li>
                <li>Automated backups with geographic redundancy</li>
              </ul>
              <p className="text-slate-600 leading-relaxed mt-4">
                Data retention: We retain your data for as long as your account is active. Upon
                account deletion, your data will be permanently removed within 90 days, except where
                legal retention requirements apply.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">4. Third-Party Services</h2>
              <p className="text-slate-600 leading-relaxed mb-4">
                We may share limited data with trusted third-party service providers:
              </p>
              <ul className="list-disc pl-6 text-slate-600 space-y-2">
                <li>
                  <strong>Cloud Infrastructure:</strong> For secure data hosting and processing
                </li>
                <li>
                  <strong>AI Services:</strong> For providing writing assistance features (data is
                  processed but not stored by AI providers)
                </li>
                <li>
                  <strong>Analytics:</strong> For understanding service usage (anonymized data only)
                </li>
                <li>
                  <strong>Payment Processors:</strong> For handling subscription payments
                </li>
              </ul>
              <p className="text-slate-600 leading-relaxed mt-4">
                All third-party providers are contractually obligated to maintain data
                confidentiality and security.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">5. Your Rights (GDPR Compliance)</h2>
              <p className="text-slate-600 leading-relaxed mb-4">
                Under GDPR and similar privacy regulations, you have the following rights:
              </p>
              <ul className="list-disc pl-6 text-slate-600 space-y-2">
                <li>
                  <strong>Right to Access:</strong> Request a copy of your personal data
                </li>
                <li>
                  <strong>Right to Rectification:</strong> Correct inaccurate or incomplete data
                </li>
                <li>
                  <strong>Right to Erasure:</strong> Request deletion of your personal data
                </li>
                <li>
                  <strong>Right to Portability:</strong> Export your data in a machine-readable
                  format
                </li>
                <li>
                  <strong>Right to Restrict Processing:</strong> Limit how we use your data
                </li>
                <li>
                  <strong>Right to Object:</strong> Object to certain types of data processing
                </li>
                <li>
                  <strong>Right to Withdraw Consent:</strong> Withdraw previously given consent
                </li>
              </ul>
              <p className="text-slate-600 leading-relaxed mt-4">
                To exercise any of these rights, please contact our Data Protection Officer at
                privacy@coaregrantmaster.com. We will respond within 30 days.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">6. Cookies and Tracking</h2>
              <p className="text-slate-600 leading-relaxed mb-4">We use the following types of cookies:</p>
              <ul className="list-disc pl-6 text-slate-600 space-y-2">
                <li>
                  <strong>Essential Cookies:</strong> Required for the Service to function (cannot
                  be disabled)
                </li>
                <li>
                  <strong>Functional Cookies:</strong> Remember your preferences and settings
                </li>
                <li>
                  <strong>Analytics Cookies:</strong> Help us understand how users interact with the
                  Service
                </li>
              </ul>
              <p className="text-slate-600 leading-relaxed mt-4">
                You can manage cookie preferences through your browser settings. Note that disabling
                certain cookies may affect Service functionality.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">7. International Data Transfers</h2>
              <p className="text-slate-600 leading-relaxed">
                If you are located outside the United States, your data may be transferred to and
                processed in the United States. We ensure appropriate safeguards are in place,
                including Standard Contractual Clauses approved by the European Commission, to
                protect your data during such transfers.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">8. Children&apos;s Privacy</h2>
              <p className="text-slate-600 leading-relaxed">
                The Service is not intended for users under 18 years of age. We do not knowingly
                collect personal information from children. If we become aware that we have
                collected data from a child, we will delete it promptly.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">9. Contact Us</h2>
              <p className="text-slate-600 leading-relaxed">
                For privacy-related inquiries or to exercise your data rights:
                <br />
                <br />
                <strong>Data Protection Officer</strong>
                <br />
                Email: privacy@coaregrantmaster.com
                <br />
                <br />
                <strong>General Inquiries</strong>
                <br />
                Email: support@coaregrantmaster.com
                <br />
                <br />
                We are committed to resolving any concerns about your privacy. If you are not
                satisfied with our response, you have the right to lodge a complaint with your local
                data protection authority.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
