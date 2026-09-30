import { client } from '../src/api/generated/client.gen';
import {
  postApiV1AuthLogin,
  getApiV1Enterprises,
  postApiV1Enterprises,
  getApiV1EnterprisesByEnterpriseId,
  patchApiV1EnterprisesByEnterpriseId,
  patchApiV1EnterprisesByEnterpriseIdStatus,
  deleteApiV1EnterprisesByEnterpriseId,
} from '../src/api/generated/sdk.gen';

async function main() {
  console.log('===============================================================');
  console.log('  TESTING FRONTEND GENERATED SDK <-> BACKEND API INTEGRATION');
  console.log('===============================================================\n');

  client.setConfig({
    baseUrl: 'http://localhost:3000',
  });

  // 1. Admin Login via Frontend SDK
  console.log('1. Admin login via postApiV1AuthLogin...');
  const loginRes = await postApiV1AuthLogin({
    body: {
      identifier: 'admin@example.com',
      password: 'Admin123456!',
    },
  });

  if (loginRes.error || !loginRes.data) {
    console.error('Login failed:', loginRes.error);
    process.exit(1);
  }
  const token = (loginRes.data as any).tokens.accessToken;
  console.log('   ✓ Logged in successfully. Access token obtained.');

  // Set global auth for FE SDK
  client.setConfig({
    auth: () => token,
  });

  // 2. Fetch initial enterprise list
  console.log('\n2. Querying enterprise list via getApiV1Enterprises...');
  const listRes = await getApiV1Enterprises({
    query: { page: 1, limit: 10 },
  });
  if (listRes.error || !listRes.data) {
    console.error('List query failed:', listRes.error);
    process.exit(1);
  }
  console.log('List response:', JSON.stringify(listRes.data, null, 2));
  console.log(`   ✓ Successfully queried enterprises.`);

  // 3. Create enterprise via postApiV1Enterprises (Payload matches FE EnterpriseFormPage)
  const testTaxCode = `03${Math.floor(10000000 + Math.random() * 90000000)}`;
  console.log(`\n3. Creating enterprise with tax code ${testTaxCode} via postApiV1Enterprises...`);
  const createRes = await postApiV1Enterprises({
    body: {
      name: 'VNG Cloud & AI Corporation',
      legal_name: 'VNG Cloud Technology Joint Stock Company',
      tax_code: testTaxCode,
      registration_number: 'REG-2026-VNG',
      email: 'contact@vngcloud.vn',
      phone: '+842839123456',
      website: 'https://vngcloud.vn',
      industry: 'Information Technology',
      sub_industries: ['Cloud Computing', 'AI', 'SaaS'],
      company_size: '501-1000',
      company_type: 'Product',
      founded_year: 2014,
      tech_stack: ['TypeScript', 'Kubernetes', 'Go', 'React', 'MongoDB'],
      benefits: ['Premium Healthcare', 'Remote Budget', 'Stock Options'],
      description: 'Leading cloud computing and digital infrastructure ecosystem in Southeast Asia.',
      address: {
        street: 'Z06 Street 13, Tan Thuan Dong Ward',
        city: 'Ho Chi Minh',
        district: 'District 7',
        state_province: 'Ho Chi Minh',
        country: 'Vietnam',
        postal_code: '70000',
      },
    },
  });

  if (createRes.error || !createRes.data) {
    console.error('Create enterprise failed:', createRes.error);
    process.exit(1);
  }
  const createdEnt = createRes.data;
  console.log(`   ✓ Created enterprise "${createdEnt.name}" (ID: ${createdEnt.id}, Status: ${createdEnt.status})`);

  // 4. Fetch detail
  console.log(`\n4. Fetching enterprise detail via getApiV1EnterprisesByEnterpriseId...`);
  const detailRes = await getApiV1EnterprisesByEnterpriseId({
    path: { enterpriseId: createdEnt.id },
  });
  if (detailRes.error || !detailRes.data) {
    console.error('Detail query failed:', detailRes.error);
    process.exit(1);
  }
  console.log(`   ✓ Detail retrieved: legalName="${detailRes.data.legalName}", phone="${detailRes.data.phone}"`);

  // 5. Update enterprise information via patchApiV1EnterprisesByEnterpriseId
  console.log(`\n5. Updating enterprise phone and benefits via patchApiV1EnterprisesByEnterpriseId...`);
  const updateRes = await patchApiV1EnterprisesByEnterpriseId({
    path: { enterpriseId: createdEnt.id },
    body: {
      phone: '+842839999999',
      benefits: ['Premium Healthcare', 'Remote Budget', 'Stock Options', 'Annual Bonus 13th+'],
    },
  });
  if (updateRes.error || !updateRes.data) {
    console.error('Update failed:', updateRes.error);
    process.exit(1);
  }
  console.log(`   ✓ Updated successfully: new phone="${updateRes.data.phone}", benefits count=${updateRes.data.benefits?.length}`);

  // 6. Suspend enterprise with justification reason
  console.log(`\n6. Suspending enterprise with valid justification reason...`);
  const suspendRes = await patchApiV1EnterprisesByEnterpriseIdStatus({
    path: { enterpriseId: createdEnt.id },
    body: {
      status: 'suspended',
      reason: 'Pending verification of annual business license compliance',
    },
  });
  if (suspendRes.error || !suspendRes.data) {
    console.error('Suspend failed:', suspendRes.error);
    process.exit(1);
  }
  console.log(`   ✓ Status transitioned to: ${suspendRes.data.status} (Reason recorded: "${suspendRes.data.statusReason}")`);

  // 7. Reactivate enterprise
  console.log(`\n7. Reactivating enterprise back to active...`);
  const reactivateRes = await patchApiV1EnterprisesByEnterpriseIdStatus({
    path: { enterpriseId: createdEnt.id },
    body: {
      status: 'active',
      reason: 'Business license re-verified successfully by admin team',
    },
  });
  if (reactivateRes.error || !reactivateRes.data) {
    console.error('Reactivation failed:', reactivateRes.error);
    process.exit(1);
  }
  console.log(`   ✓ Status restored to: ${reactivateRes.data.status}`);

  // 8. Soft Delete enterprise
  console.log(`\n8. Deleting enterprise via deleteApiV1EnterprisesByEnterpriseId...`);
  const deleteRes = await deleteApiV1EnterprisesByEnterpriseId({
    path: { enterpriseId: createdEnt.id },
  });
  if (deleteRes.error || !deleteRes.data) {
    console.error('Delete failed:', deleteRes.error);
    process.exit(1);
  }
  console.log(`   ✓ Delete confirmed: ${(deleteRes.data as any).message}`);

  // 9. Verify inaccessible after deletion
  console.log(`\n9. Verifying enterprise is no longer accessible...`);
  const verifyRes = await getApiV1EnterprisesByEnterpriseId({
    path: { enterpriseId: createdEnt.id },
  });
  if (verifyRes.error) {
    console.log(`   ✓ Expected 404 received when querying soft-deleted enterprise.`);
  } else {
    console.error('Expected 404 but enterprise was still found!');
    process.exit(1);
  }

  console.log('\n===============================================================');
  console.log('  ALL FRONTEND SDK <-> BACKEND API INTEGRATIONS PASSED (100%)');
  console.log('===============================================================\n');
}

main().catch((err) => {
  console.error('Integration test failed with error:', err);
  process.exit(1);
});
