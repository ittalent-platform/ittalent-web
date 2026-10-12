import { createRequire } from "node:module";

import { backendEnv } from "./environment";
import { JOB_POSTING_ACCOUNTS, JOB_POSTING_E2E } from "./job-posting-data";
import { PASSWORD } from "./support";

type BcryptModule = {
  hash(value: string, rounds: number): Promise<string>;
};

const requireFromBackend = createRequire(
  new URL("../../ittalent-backend-cv/package.json", import.meta.url),
);
const bcrypt = requireFromBackend("bcryptjs") as BcryptModule;
const DAY_MS = 86_400_000;
const BCRYPT_ROUNDS = 10;

/**
 * Rebuilds only the Enterprise Admin Job Posting namespace inside the dedicated
 * E2E database. Applicant fixtures use unrelated users and enterprises.
 */
export async function seedEnterpriseAdminJobPostings(): Promise<void> {
  Object.assign(process.env, backendEnv);
  const [
    databaseModule,
    accountModule,
    enterpriseModule,
    auditModule,
    jobModule,
    userModule,
  ] = await Promise.all([
    import("../../ittalent-backend-cv/src/config/db.ts"),
    import("../../ittalent-backend-cv/src/models/account.model.ts"),
    import("../../ittalent-backend-cv/src/models/enterprise.model.ts"),
    import("../../ittalent-backend-cv/src/models/job-posting-audit.model.ts"),
    import("../../ittalent-backend-cv/src/models/job-posting.model.ts"),
    import("../../ittalent-backend-cv/src/models/user.model.ts"),
  ]);
  const { connectDatabase, disconnectDatabase } = databaseModule;
  const { Account } = accountModule;
  const { Enterprise } = enterpriseModule;
  const { JobPostingAuditEvent } = auditModule;
  const { JobPosting } = jobModule;
  const { User } = userModule;
  const enterpriseIds = [
    JOB_POSTING_E2E.enterpriseAId,
    JOB_POSTING_E2E.enterpriseBId,
  ];
  const userIds = Object.values(JOB_POSTING_E2E.userIds);

  await connectDatabase();
  try {
    await JobPostingAuditEvent.deleteMany({
      enterprise_id: { $in: enterpriseIds },
    });
    await JobPosting.deleteMany({ enterprise_id: { $in: enterpriseIds } });
    await Account.deleteMany({ user_id: { $in: userIds } });
    await User.deleteMany({
      $or: [
        { _id: { $in: userIds } },
        { email: { $in: Object.values(JOB_POSTING_ACCOUNTS) } },
      ],
    });
    await Enterprise.deleteMany({
      $or: [
        { _id: { $in: enterpriseIds } },
        { tax_code: { $in: ["E2E-EA-ALPHA", "E2E-EA-BETA"] } },
      ],
    });

    await User.insertMany([
      {
        _id: JOB_POSTING_E2E.userIds.enterpriseAdmin,
        email: JOB_POSTING_ACCOUNTS.enterpriseAdmin,
        username: "e2e_enterprise_admin",
        role: "enterprise_admin",
        status: "active",
        email_verified: true,
        enterprise_id: JOB_POSTING_E2E.enterpriseAId,
      },
      {
        _id: JOB_POSTING_E2E.userIds.recruiterA1,
        email: JOB_POSTING_ACCOUNTS.recruiterA1,
        username: "e2e_recruiter_a1",
        role: "recruiter",
        status: "active",
        email_verified: true,
        enterprise_id: JOB_POSTING_E2E.enterpriseAId,
      },
      {
        _id: JOB_POSTING_E2E.userIds.recruiterA2,
        email: JOB_POSTING_ACCOUNTS.recruiterA2,
        username: "e2e_recruiter_a2",
        role: "recruiter",
        status: "active",
        email_verified: true,
        enterprise_id: JOB_POSTING_E2E.enterpriseAId,
      },
      {
        _id: JOB_POSTING_E2E.userIds.recruiterB,
        email: JOB_POSTING_ACCOUNTS.recruiterB,
        username: "e2e_recruiter_b",
        role: "recruiter",
        status: "active",
        email_verified: true,
        enterprise_id: JOB_POSTING_E2E.enterpriseBId,
      },
    ]);

    const passwordHash = await bcrypt.hash(PASSWORD, BCRYPT_ROUNDS);
    await Account.insertMany(
      userIds.map((userId) => ({
        user_id: userId,
        provider: "local",
        password_hash: passwordHash,
      })),
    );

    await Enterprise.insertMany([
      {
        _id: JOB_POSTING_E2E.enterpriseAId,
        name: JOB_POSTING_E2E.enterpriseAName,
        tax_code: "E2E-EA-ALPHA",
        email: "alpha-job-e2e@example.com",
        phone: "+84910000001",
        industry: "Information Technology",
        company_size: "51-200",
        address: {
          street: "1 Alpha E2E Street",
          city: "Ho Chi Minh City",
          country: "Vietnam",
        },
        status: "active",
        creator_account_id: JOB_POSTING_E2E.userIds.recruiterA1,
        is_deleted: false,
      },
      {
        _id: JOB_POSTING_E2E.enterpriseBId,
        name: JOB_POSTING_E2E.enterpriseBName,
        tax_code: "E2E-EA-BETA",
        email: "beta-job-e2e@example.com",
        phone: "+84910000002",
        industry: "Information Technology",
        company_size: "11-50",
        address: {
          street: "2 Beta E2E Street",
          city: "Ha Noi",
          country: "Vietnam",
        },
        status: "active",
        creator_account_id: JOB_POSTING_E2E.userIds.recruiterB,
        is_deleted: false,
      },
    ]);

    const expiresAt = new Date(Date.now() + 60 * DAY_MS);
    const publishedAt = new Date(Date.now() - DAY_MS);
    const closedAt = new Date();
    const commonPublishedFields = {
      location: "Ho Chi Minh City",
      employment_type: "Full-time",
      currency: "VND",
      level: "Mid",
      description: "A deterministic end-to-end job posting description.",
      requirements: "At least twenty characters of test requirements.",
      benefits: "A stable set of benefits for browser automation.",
      openings: 2,
      salary_min: 20_000_000,
      salary_max: 35_000_000,
      expires_at: expiresAt,
    };
    const jobs = [
      {
        _id: JOB_POSTING_E2E.jobs.sharedDetail.id,
        enterprise_id: JOB_POSTING_E2E.enterpriseAId,
        posted_by_user_id: JOB_POSTING_E2E.userIds.recruiterA1,
        title: JOB_POSTING_E2E.jobs.sharedDetail.title,
        slug: "e2e-ea-recruiter-shared-detail",
        status: "published",
        published_at: publishedAt,
        ...commonPublishedFields,
      },
      {
        _id: JOB_POSTING_E2E.jobs.recruiterTwo.id,
        enterprise_id: JOB_POSTING_E2E.enterpriseAId,
        posted_by_user_id: JOB_POSTING_E2E.userIds.recruiterA2,
        title: JOB_POSTING_E2E.jobs.recruiterTwo.title,
        slug: "e2e-ea-recruiter-two-job",
        status: "published",
        published_at: publishedAt,
        ...commonPublishedFields,
      },
      {
        _id: JOB_POSTING_E2E.jobs.draftPublish.id,
        enterprise_id: JOB_POSTING_E2E.enterpriseAId,
        posted_by_user_id: JOB_POSTING_E2E.userIds.recruiterA1,
        title: JOB_POSTING_E2E.jobs.draftPublish.title,
        slug: "e2e-ea-draft-publish-target",
        status: "draft",
        ...commonPublishedFields,
      },
      {
        _id: JOB_POSTING_E2E.jobs.closeReopen.id,
        enterprise_id: JOB_POSTING_E2E.enterpriseAId,
        posted_by_user_id: JOB_POSTING_E2E.userIds.recruiterA1,
        title: JOB_POSTING_E2E.jobs.closeReopen.title,
        slug: "e2e-ea-close-reopen-target",
        status: "published",
        published_at: publishedAt,
        ...commonPublishedFields,
      },
      {
        _id: JOB_POSTING_E2E.jobs.archive.id,
        enterprise_id: JOB_POSTING_E2E.enterpriseAId,
        posted_by_user_id: JOB_POSTING_E2E.userIds.recruiterA2,
        title: JOB_POSTING_E2E.jobs.archive.title,
        slug: "e2e-ea-archive-target",
        status: "closed",
        published_at: publishedAt,
        closed_at: closedAt,
        ...commonPublishedFields,
      },
      {
        _id: JOB_POSTING_E2E.jobs.searchable.id,
        enterprise_id: JOB_POSTING_E2E.enterpriseAId,
        posted_by_user_id: JOB_POSTING_E2E.userIds.recruiterA2,
        title: JOB_POSTING_E2E.jobs.searchable.title,
        slug: "e2e-ea-searchable-contract",
        status: "published",
        published_at: publishedAt,
        ...commonPublishedFields,
        employment_type: "Contract",
        level: "Senior",
      },
      {
        _id: JOB_POSTING_E2E.jobs.foreign.id,
        enterprise_id: JOB_POSTING_E2E.enterpriseBId,
        posted_by_user_id: JOB_POSTING_E2E.userIds.recruiterB,
        title: JOB_POSTING_E2E.jobs.foreign.title,
        slug: "e2e-ea-foreign-enterprise-job",
        status: "published",
        published_at: publishedAt,
        ...commonPublishedFields,
        location: "Ha Noi",
      },
    ];
    await JobPosting.insertMany(jobs);
    await JobPostingAuditEvent.insertMany(
      jobs.map((job) => ({
        job_posting_id: job._id,
        enterprise_id: job.enterprise_id,
        actor_user_id: job.posted_by_user_id,
        action: "create",
        result: "success",
        job_title: job.title,
      })),
    );
  } finally {
    await disconnectDatabase();
  }
}
