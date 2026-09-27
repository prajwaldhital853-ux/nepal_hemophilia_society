export type LegalDocumentId = "terms" | "privacy";

export type LegalSection = {
  heading: string;
  paragraphs: string[];
};

export type LegalDocument = {
  title: string;
  updated: string;
  intro: string;
  sections: LegalSection[];
};

const UPDATED = "27 September 2026";

export const legalDocuments: Record<LegalDocumentId, LegalDocument> = {
  privacy: {
    title: "Privacy Policy",
    updated: UPDATED,
    intro:
      "This Privacy Policy explains how the Nepal Hemophilia Digital Management System (NHMS) patient app collects, uses, shares, and protects your information. It applies to the patient mobile app operated for the Nepal Hemophilia Society (NHS).",
    sections: [
      {
        heading: "1. Who we are",
        paragraphs: [
          "NHMS is a national digital system for hemophilia care in Nepal. It connects verified patients with treatment centres, province administrators, and national administrators.",
          "The patient app is for people whose records have been created by an authorised NHMS administrator. You cannot create a clinical account yourself through this app.",
          "For privacy questions, contact the Nepal Hemophilia Society using the details at the end of this policy.",
        ],
      },
      {
        heading: "2. Information we collect",
        paragraphs: [
          "Account information: your name, Unique Patient ID, email, mobile number, login credentials, and whether you must change a temporary password.",
          "Profile and identity information: date of birth, gender, address, province, district, emergency contact, photo if one was added, and verification status.",
          "Clinical information entered by you or by authorised staff: hemophilia type and severity, inhibitor status, prescribed factor, bleeding episodes, injections, treatments, hospital visits, appointments, and related notes.",
          "Documents: diagnosis papers, reports, and other files uploaded to your record. Files are stored in secure file storage. The app stores a reference to the file, not a public copy.",
          "Device and security information: a device identifier and limited device signals used to limit failed login attempts on that device. We do not use this to advertise to you.",
          "App activity needed to run the service: notification delivery tokens, appointment requests you submit, and basic timestamps of sign-in and sign-out.",
        ],
      },
      {
        heading: "3. How we use your information",
        paragraphs: [
          "To identify you with your Unique Patient ID and let authorised clinicians see the care history they need when you attend a centre.",
          "To record injections, bleeding episodes, treatments, visits, and documents so your care is not split across paper files.",
          "To manage factor stock at treatment centres when an injection is logged against your prescribed product.",
          "To schedule and remind you about appointments, and to send clinical or account notifications you have enabled.",
          "To keep the service secure: verify your password, lock a device after repeated failed sign-in attempts, and keep an audit trail of privileged actions.",
          "To produce reports for authorised administrators. Reports are limited to the role’s scope (a centre, a province, or national oversight). They are not published on the public website.",
        ],
      },
      {
        heading: "4. Who can see your information",
        paragraphs: [
          "You can see your own profile, history, documents, and appointments in this app.",
          "Treatment and centre staff can see and update records for patients in their centre, and may open a record by Unique Patient ID when providing care outside the usual roster, where the system allows it.",
          "Province administrators can see patients and activity in their province. National administrators can see records needed for national coordination. Super Admin access is limited to designated NHS operators.",
          "We do not sell your information. We do not place your medical record on the public NHMS website.",
          "We may share information when required by applicable Nepali law, or with a service provider that hosts the app, database, file storage, or notification delivery, only so they can operate NHMS under instruction.",
        ],
      },
      {
        heading: "5. Your rights",
        paragraphs: [
          "Access: you can view the information shown in your app profile and history.",
          "Correction: ask your treatment centre or NHMS administrator to correct profile or clinical details that are wrong. Some clinical entries are kept as a history and corrected with a new entry rather than silently erased.",
          "Account credentials: you choose your own password after the first temporary password. Do not share your password or Unique Patient ID.",
          "Notifications: you can control push notifications from your device settings. Turning them off does not delete your clinical record.",
          "Questions or complaints: contact NHS using the details below. If a law gives you additional rights over health information, you may exercise them through NHS or the centre that holds your record.",
        ],
      },
      {
        heading: "6. How we protect your data",
        paragraphs: [
          "The app talks to the NHMS server over encrypted connections (HTTPS).",
          "Access is limited by role. Staff only receive the permissions their administrator assigned.",
          "Sign-in is protected by your password. After several failed attempts, that physical device is locked for a short period.",
          "Temporary passwords issued by an administrator must be replaced before normal use continues.",
          "Privileged actions in the admin system are written to an audit log so misuse can be reviewed.",
          "No system is perfectly secure. Protect your phone with a screen lock, and tell your centre immediately if you think someone else has used your account.",
        ],
      },
      {
        heading: "7. How long we keep information",
        paragraphs: [
          "Clinical records, documents, and related audit history are kept for as long as NHS needs them for treatment, safety, and legal duties.",
          "If your account is deactivated, the clinical record may still be retained so future care and national reporting remain accurate.",
          "Security logs related to sign-in may be kept for a limited period and then removed or archived under NHS policy.",
        ],
      },
      {
        heading: "8. Children",
        paragraphs: [
          "A parent or guardian may be the emergency contact and may help a child use the app. The clinical record still belongs to the patient’s care under NHS and the treatment centre. Guardians should keep login details private.",
        ],
      },
      {
        heading: "9. Changes to this policy",
        paragraphs: [
          "If we change this policy, we will update the date at the top. Continued use of the app after an update means you accept the revised policy. For a material change, we may also show a notice in the app or ask you to agree again before sign-in.",
        ],
      },
      {
        heading: "10. Contact",
        paragraphs: [
          "Nepal Hemophilia Society",
          "Nepal Hemophilia Digital Management System (NHMS)",
          "Email: info@nepalhemophilia.org.np",
          "Phone: 01-4443386",
          "Ask your treatment centre if you need help with your own record.",
        ],
      },
    ],
  },
  terms: {
    title: "Terms and Conditions",
    updated: UPDATED,
    intro:
      "These Terms and Conditions govern your use of the Nepal Hemophilia Digital Management System (NHMS) patient app. By creating a session in the app, you agree to these terms and to the Privacy Policy.",
    sections: [
      {
        heading: "1. The service",
        paragraphs: [
          "NHMS is a digital care system for people with hemophilia in Nepal. The patient app lets a verified patient view their record, submit selected updates (such as bleeding episodes and appointment requests), receive notices, and see emergency identification information.",
          "Clinical decisions remain with qualified clinicians. The app does not replace emergency care. If you have a serious bleed, head injury, or other emergency, contact your treatment centre or local emergency services immediately.",
        ],
      },
      {
        heading: "2. Your account",
        paragraphs: [
          "Patient accounts are created only by an authorised NHMS administrator at a treatment centre or by NHS. Self-registration is not available.",
          "You will receive a Unique Patient ID and a temporary password. You must set your own password before regular use. You are responsible for keeping that password confidential.",
          "Sign in with your email or Unique Patient ID and your password. Do not share your account. If you suspect misuse, contact your treatment centre or NHS at once.",
          "Repeated failed sign-in attempts lock the device you are using for a short time. This protects the account. It is not a penalty against the treatment centre’s network.",
        ],
      },
      {
        heading: "3. Acceptable use",
        paragraphs: [
          "Use the app only for your own care, or for a patient you are legally caring for.",
          "Do not attempt to access another patient’s record, probe the system, upload harmful files, or interfere with the service.",
          "Information you enter, including bleeding details and appointment reasons, must be accurate to the best of your knowledge. Staff may correct clinical records.",
        ],
      },
      {
        heading: "4. Clinical records and documents",
        paragraphs: [
          "Injections, treatments, visits, factor prescriptions, and many profile fields are recorded by authorised staff. You can review them in the app.",
          "Documents you or your centre upload become part of the care record. Do not upload files that contain someone else’s private information unless that person is part of your care and you are allowed to share them.",
          "NHMS may keep a history of changes. A correction does not always delete the earlier entry, because treatment safety depends on a reliable record.",
        ],
      },
      {
        heading: "5. Appointments and notifications",
        paragraphs: [
          "Appointment requests are sent to the centre you select. A centre may confirm, reschedule, or decline a request. Published appointment times are set by the centre.",
          "Push notifications are optional at the device level. Missing a notification does not change your clinical obligations. Always confirm important visits with your centre.",
        ],
      },
      {
        heading: "6. Your responsibilities",
        paragraphs: [
          "Provide a reachable mobile number and email if one is on your record, and tell your centre when they change.",
          "Keep your phone reasonably secure.",
          "Follow the care plan agreed with your clinician. The app displays information; it does not authorise you to change a prescribed factor product on your own.",
        ],
      },
      {
        heading: "7. Our responsibilities",
        paragraphs: [
          "NHS and authorised centres will use reasonable care to run NHMS, limit access by role, and protect data as described in the Privacy Policy.",
          "We may suspend access if we believe an account is compromised, misused, or no longer authorised.",
          "The service may be unavailable during maintenance, connectivity problems, or events outside our control. Clinical care at your centre does not depend on the app being online.",
        ],
      },
      {
        heading: "8. Intellectual property",
        paragraphs: [
          "The NHMS name, NHS branding, and app content provided by NHS are owned by their respective owners. You receive a personal, non-transferable right to use the app for your care. You may not copy the system for another service.",
        ],
      },
      {
        heading: "9. Changes to these terms",
        paragraphs: [
          "We may update these terms. The date at the top will change. If you do not agree, stop using the app and contact your centre. Continuing to sign in after an update means you accept the revised terms.",
        ],
      },
      {
        heading: "10. Contact",
        paragraphs: [
          "Nepal Hemophilia Society",
          "Nepal Hemophilia Digital Management System (NHMS)",
          "Email: info@nepalhemophilia.org.np",
          "Phone: 01-4443386",
        ],
      },
    ],
  },
};
