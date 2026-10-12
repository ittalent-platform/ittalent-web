export const JOB_POSTING_ACCOUNTS = {
  enterpriseAdmin: "enterprise-admin-job-e2e@example.com",
  recruiterA1: "recruiter-a1-job-e2e@example.com",
  recruiterA2: "recruiter-a2-job-e2e@example.com",
  recruiterB: "recruiter-b-job-e2e@example.com",
} as const;

export const JOB_POSTING_E2E = {
  enterpriseAId: "710000000000000000000001",
  enterpriseBId: "710000000000000000000002",
  enterpriseAName: "E2E Enterprise Alpha",
  enterpriseBName: "E2E Enterprise Beta",
  userIds: {
    enterpriseAdmin: "720000000000000000000001",
    recruiterA1: "720000000000000000000002",
    recruiterA2: "720000000000000000000003",
    recruiterB: "720000000000000000000004",
  },
  jobs: {
    sharedDetail: {
      id: "730000000000000000000001",
      title: "EA E2E Recruiter Shared Detail",
    },
    recruiterTwo: {
      id: "730000000000000000000002",
      title: "EA E2E Recruiter Two Job",
    },
    draftPublish: {
      id: "730000000000000000000003",
      title: "EA E2E Draft Publish Target",
    },
    closeReopen: {
      id: "730000000000000000000004",
      title: "EA E2E Close Reopen Target",
    },
    archive: {
      id: "730000000000000000000005",
      title: "EA E2E Archive Target",
    },
    searchable: {
      id: "730000000000000000000006",
      title: "EA E2E Searchable Contract",
    },
    foreign: {
      id: "730000000000000000000007",
      title: "EA E2E Foreign Enterprise Job",
    },
  },
} as const;

export const BROWSER_CREATED_JOB_TITLE = "EA E2E Browser Created Draft";
export const BROWSER_UPDATED_JOB_TITLE = "EA E2E Browser Updated Draft";
