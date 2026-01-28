import Link from 'next/link';
import { FileText, ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'Terms of Service - NIH Grant Master',
  description: 'Terms of Service for NIH Grant Master NIH SBIR/STTR Grant Authoring Platform',
};

export default function TermsOfService() {
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
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Terms of Service</h1>
              <p className="text-slate-500 text-sm">Last updated: January 28, 2026</p>
            </div>
          </div>

          <div className="prose prose-slate max-w-none">
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">1. Acceptance of Terms</h2>
              <p className="text-slate-600 leading-relaxed">
                By accessing or using NIH Grant Master (&quot;the Service&quot;), you agree to be bound by these
                Terms of Service. If you do not agree to these terms, please do not use the Service.
                These terms apply to all users, including researchers, grant writers, and
                organizational administrators.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">2. Service Description</h2>
              <p className="text-slate-600 leading-relaxed mb-4">
                NIH Grant Master is a professional grant authoring platform designed to assist users
                in preparing NIH SBIR (Small Business Innovation Research) and STTR (Small Business
                Technology Transfer) grant applications. The Service provides:
              </p>
              <ul className="list-disc pl-6 text-slate-600 space-y-2">
                <li>AI-assisted grant writing and editing tools</li>
                <li>Document management and version control</li>
                <li>Collaboration features for research teams</li>
                <li>Compliance checking against NIH requirements</li>
                <li>Export functionality for grant submissions</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">3. User Obligations</h2>
              <p className="text-slate-600 leading-relaxed mb-4">As a user of the Service, you agree to:</p>
              <ul className="list-disc pl-6 text-slate-600 space-y-2">
                <li>Provide accurate and complete registration information</li>
                <li>Maintain the confidentiality of your account credentials</li>
                <li>Use the Service only for lawful purposes related to grant preparation</li>
                <li>Not share, resell, or sublicense access to the Service</li>
                <li>Not attempt to reverse engineer, decompile, or extract source code</li>
                <li>Not use automated systems to access the Service without permission</li>
                <li>Comply with all applicable NIH guidelines and regulations</li>
                <li>Ensure all grant content is original or properly attributed</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">4. Intellectual Property</h2>
              <p className="text-slate-600 leading-relaxed mb-4">
                <strong>Your Content:</strong> You retain all intellectual property rights to the
                grant content, research data, and other materials you create or upload to the
                Service. By using the Service, you grant us a limited license to process and store
                your content solely for the purpose of providing the Service.
              </p>
              <p className="text-slate-600 leading-relaxed">
                <strong>Our Content:</strong> The Service, including its software, design, features,
                and documentation, is owned by NIH Grant Master and protected by intellectual
                property laws. You may not copy, modify, or distribute any part of the Service
                without explicit written permission.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">5. Limitation of Liability</h2>
              <p className="text-slate-600 leading-relaxed mb-4">
                THE SERVICE IS PROVIDED &quot;AS IS&quot; WITHOUT WARRANTIES OF ANY KIND. TO THE MAXIMUM EXTENT
                PERMITTED BY LAW:
              </p>
              <ul className="list-disc pl-6 text-slate-600 space-y-2">
                <li>
                  We do not guarantee that grant applications prepared using the Service will be
                  funded or approved by the NIH or any other agency
                </li>
                <li>
                  We are not liable for any indirect, incidental, special, consequential, or
                  punitive damages arising from your use of the Service
                </li>
                <li>
                  Our total liability shall not exceed the amount you paid for the Service in the
                  twelve months preceding the claim
                </li>
                <li>
                  We are not responsible for decisions made by funding agencies regarding your
                  grant applications
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">6. Termination</h2>
              <p className="text-slate-600 leading-relaxed mb-4">
                We reserve the right to suspend or terminate your access to the Service at any time
                for:
              </p>
              <ul className="list-disc pl-6 text-slate-600 space-y-2">
                <li>Violation of these Terms of Service</li>
                <li>Non-payment of applicable fees</li>
                <li>Fraudulent or illegal activity</li>
                <li>Extended periods of inactivity</li>
              </ul>
              <p className="text-slate-600 leading-relaxed mt-4">
                Upon termination, you will have 30 days to export your data. After this period, your
                data may be permanently deleted.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">7. Modifications to Terms</h2>
              <p className="text-slate-600 leading-relaxed">
                We may update these Terms of Service from time to time. We will notify you of
                material changes via email or through the Service. Continued use of the Service
                after changes take effect constitutes acceptance of the modified terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">8. Contact Information</h2>
              <p className="text-slate-600 leading-relaxed">
                For questions about these Terms of Service, please contact us at:
                <br />
                <strong>Email:</strong> legal@coaregrantmaster.com
                <br />
                <strong>Address:</strong> NIH Grant Master, Legal Department
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
