import { supabase } from '../lib/supabase';
import { digitalTwinService } from './digitalTwinService';

export interface ParsedMedicalLetter {
  patient: {
    givenName: string;
    familyName: string;
    middleName?: string;
    dateOfBirth: string;
    nhsNumber: string;
    hospitalNumber: string;
    address: {
      line1: string;
      line2?: string;
      city: string;
      county: string;
      postcode: string;
    };
    phone: string;
  };
  encounter: {
    appointmentDate: string;
    department: string;
    practitioner: string;
    letterDate: string;
  };
  presentingComplaint: {
    description: string;
    onset: string;
    symptoms: string[];
  };
  clinicalFindings: {
    ecg?: string;
    imaging?: string[];
  };
  diagnoses: Array<{
    condition: string;
    code?: string;
    severity?: string;
    date?: string;
  }>;
  procedures: Array<{
    name: string;
    date: string;
    operator: string;
    details: string[];
    outcome?: string;
    complications?: string[];
  }>;
  medications: Array<{
    name: string;
    dose: string;
    frequency: string;
    route?: string;
    duration?: string;
    instructions?: string;
  }>;
  treatmentPlan: {
    currentStatus: string;
    recommendations: string[];
    followUp: string;
    workRestrictions?: string;
  };
}

export async function parseSimonGrangeLetter(): Promise<ParsedMedicalLetter> {
  return {
    patient: {
      givenName: 'Simon',
      familyName: 'Grange',
      middleName: 'Andre Welham',
      dateOfBirth: '1966-06-07',
      nhsNumber: '450 437 4846',
      hospitalNumber: '39776265',
      address: {
        line1: '82 Collinswood Drive',
        city: 'ST. LEONARDS-ON-SEA',
        county: 'EAST SUSSEX',
        postcode: 'TN38 0NX',
      },
      phone: '07783 011919',
    },
    encounter: {
      appointmentDate: '2025-02-24',
      department: 'Cardiac Surgery General',
      practitioner: 'Dr Mohammad Salman',
      letterDate: '2025-03-05',
    },
    presentingComplaint: {
      description: 'Crushing chest pain radiating to arms, shoulders, and jaw',
      onset: '2024-12-31',
      symptoms: [
        'Crushing chest pain',
        'Radiation to arms',
        'Radiation to shoulders',
        'Radiation to jaw',
        'Troponin rise from 66 to 350',
      ],
    },
    clinicalFindings: {
      ecg: 'T-wave inversion laterally',
      imaging: ['Angiogram showed triple vessel disease'],
    },
    diagnoses: [
      {
        condition: 'Triple vessel coronary artery disease',
        code: 'I25.1',
        severity: 'severe',
        date: '2025-01-01',
      },
      {
        condition: 'NSTEMI (Non-ST elevation myocardial infarction)',
        code: 'I21.4',
        severity: 'severe',
        date: '2024-12-31',
      },
      {
        condition: 'Post-operative chest infection',
        code: 'J95.851',
        severity: 'moderate',
        date: '2025-01-08',
      },
      {
        condition: 'Sternal discomfort and soreness',
        severity: 'mild',
        date: '2025-02-24',
      },
    ],
    procedures: [
      {
        name: 'Coronary angiography',
        date: '2025-01-01',
        operator: 'Unknown',
        details: ['Demonstrated triple vessel disease'],
        outcome: 'Abnormal - triple vessel disease identified',
      },
      {
        name: 'CABG x3 (Coronary Artery Bypass Graft)',
        date: '2025-01-08',
        operator: 'Mr. Sabetai',
        details: [
          'LIMA → mid LAD (2.5mm, excellent target)',
          'Left Radial → OM2 (2.5mm, excellent target)',
          'Left Long Saphenous Vein → distal RCA (1.5mm, very small, excellent run-off)',
        ],
        outcome: 'Successful revascularization',
        complications: ['Post-operative chest infection treated with antibiotics'],
      },
    ],
    medications: [
      {
        name: 'Amlodipine',
        dose: '10 mg',
        frequency: 'OD',
        route: 'oral',
      },
      {
        name: 'Asprin',
        dose: '75 mg',
        frequency: 'OD',
        route: 'oral',
      },
      {
        name: 'Atorvastatin',
        dose: '80 mg',
        frequency: 'OD',
        route: 'oral',
      },
      {
        name: 'Bisoprolol',
        dose: '3.75 mg',
        frequency: 'AM',
        route: 'oral',
      },
      {
        name: 'Bisoprolol',
        dose: '2.5 mg',
        frequency: 'PM',
        route: 'oral',
      },
      {
        name: 'Clopidogrel',
        dose: '75 mg',
        frequency: 'OD',
        route: 'oral',
        duration: '1 year',
        instructions: 'For vein graft',
      },
      {
        name: 'Pantoprazole',
        dose: '40 mg',
        frequency: 'OD',
        route: 'oral',
        instructions: 'Can be stopped after Clopidogrel course completes',
      },
      {
        name: 'Ramipril',
        dose: '1.25 mg',
        frequency: 'OD',
        route: 'oral',
        instructions: 'May titrate up accordingly',
      },
    ],
    treatmentPlan: {
      currentStatus: 'Overall doing well, wounds healed, sternum stable',
      recommendations: [
        'Refrain from returning to work until fully completed rehabilitation',
        'If physiotherapist says not regaining confidence in physical ability, explore alternative roles or consider retirement',
        'Amlodipine recommended for 6 months for vein graft, then cease',
        'May up titrate Ramipril accordingly',
        'Clopidogrel for one year, then Pantoprazole can be stopped',
      ],
      followUp: 'Discharged back to GP and referring team',
      workRestrictions:
        'Not to return to work as orthopaedic surgeon - range and power still limited by pain',
    },
  };
}

export async function storeLetterDataInDigitalTwin(
  userId: string
): Promise<{
  patientId: string;
  baselineId: string;
  summary: string;
}> {
  const letterData = await parseSimonGrangeLetter();
  const dtService = digitalTwinService(supabase);

  console.log('Creating patient record...');
  const patientId = await dtService.createPatient(userId, {
    givenName: letterData.patient.givenName,
    familyName: letterData.patient.familyName,
    middleName: letterData.patient.middleName,
    dateOfBirth: letterData.patient.dateOfBirth,
    nhsNumber: letterData.patient.nhsNumber,
    hospitalNumber: letterData.patient.hospitalNumber,
    address: letterData.patient.address,
    phone: letterData.patient.phone,
  });

  console.log('Creating encounter...');
  const encounterId = await dtService.createEncounter(userId, patientId, {
    encounterType: 'outpatient',
    status: 'finished',
    startDate: letterData.encounter.appointmentDate,
    locationName: letterData.encounter.department,
    primaryPractitioner: letterData.encounter.practitioner,
    reasonText: 'Post-CABG follow-up',
    summary: letterData.treatmentPlan.currentStatus,
  });

  console.log('Creating conditions...');
  const conditionIds: string[] = [];
  for (const diagnosis of letterData.diagnoses) {
    const conditionId = await dtService.createCondition(userId, patientId, {
      code: diagnosis.code,
      codeSystem: diagnosis.code ? 'ICD-10' : undefined,
      display: diagnosis.condition,
      clinicalStatus: 'active',
      verificationStatus: 'confirmed',
      onsetDate: diagnosis.date,
      severity: diagnosis.severity,
    });
    conditionIds.push(conditionId);

    await dtService.createRelationship(
      userId,
      'patient',
      patientId,
      'condition',
      conditionId,
      'has_condition',
      'Diagnosed condition'
    );
  }

  console.log('Creating procedures...');
  const procedureIds: string[] = [];
  for (const proc of letterData.procedures) {
    const procedureId = await dtService.createProcedure(userId, patientId, {
      display: proc.name,
      category: 'surgical',
      performedDate: proc.date,
      outcome: proc.outcome,
      complications: proc.complications,
      notes: proc.details.join('; '),
      primaryPerformer: proc.operator,
      location: 'St Thomas\' Hospital',
    });
    procedureIds.push(procedureId);

    await dtService.createRelationship(
      userId,
      'patient',
      patientId,
      'procedure',
      procedureId,
      'underwent_procedure',
      'Cardiac surgery'
    );

    if (proc.name.includes('CABG')) {
      await dtService.createRelationship(
        userId,
        'procedure',
        procedureId,
        'condition',
        conditionIds[0],
        'treats_condition',
        'Revascularization for triple vessel disease'
      );
    }
  }

  console.log('Creating observations...');
  const observationIds: string[] = [];

  const troponinObs = await dtService.createObservation(userId, patientId, {
    code: '6598-7',
    codeSystem: 'LOINC',
    display: 'Troponin T',
    category: 'laboratory',
    effectiveDate: '2024-12-31',
    valueQuantity: 350,
    valueUnit: 'ng/L',
    interpretation: 'critical',
    notes: 'Rose from 66 to 350',
  });
  observationIds.push(troponinObs);

  const ecgObs = await dtService.createObservation(userId, patientId, {
    display: 'ECG',
    category: 'procedure',
    effectiveDate: '2024-12-31',
    valueString: 'T-wave inversion laterally',
    interpretation: 'abnormal',
  });
  observationIds.push(ecgObs);

  const painObs = await dtService.createObservation(userId, patientId, {
    code: '22253000',
    codeSystem: 'SNOMED-CT',
    display: 'Sternal pain',
    category: 'vital-signs',
    effectiveDate: letterData.encounter.appointmentDate,
    valueString: 'Limited range and power',
    interpretation: 'abnormal',
    notes: 'Range and power still limited by pain',
  });
  observationIds.push(painObs);

  console.log('Creating medications...');
  const medicationIds: string[] = [];
  for (const med of letterData.medications) {
    const medicationId = await dtService.createMedication(userId, patientId, {
      medicationName: med.name,
      doseQuantity: parseFloat(med.dose),
      doseUnit: 'mg',
      route: med.route || 'oral',
      frequency: med.frequency,
      status: 'active',
      prescribedDate: letterData.encounter.letterDate,
      startDate: letterData.encounter.letterDate,
      durationDays: med.duration === '1 year' ? 365 : undefined,
      indication: 'Post-CABG management',
      instructions: med.instructions,
      prescriberName: letterData.encounter.practitioner,
    });
    medicationIds.push(medicationId);

    await dtService.createRelationship(
      userId,
      'patient',
      patientId,
      'medication',
      medicationId,
      'takes_medication',
      'Post-operative cardiac medication regimen'
    );
  }

  console.log('Creating treatment plan...');
  const treatmentPlanId = await dtService.createTreatmentPlan(
    userId,
    patientId,
    {
      title: 'Post-CABG Rehabilitation and Recovery',
      description: 'Comprehensive post-operative care plan following triple vessel CABG',
      status: 'active',
      startDate: letterData.encounter.letterDate,
      goals: [
        {
          description: 'Complete cardiac rehabilitation program',
          priority: 'high',
          target: 'Full physical recovery',
        },
        {
          description: 'Medication adherence and monitoring',
          priority: 'high',
          target: 'Optimal cardiovascular protection',
        },
        {
          description: 'Work capability assessment',
          priority: 'medium',
          target: 'Determine return to work or retirement options',
        },
      ],
      activities: letterData.treatmentPlan.recommendations.map(rec => ({
        description: rec,
        status: 'in-progress',
      })),
      primaryPractitioner: letterData.encounter.practitioner,
      notes: letterData.treatmentPlan.workRestrictions,
    }
  );

  console.log('Creating digital twin baseline...');
  const baselineId = await dtService.createDigitalTwinBaseline(
    userId,
    patientId,
    'Post-CABG Initial Baseline',
    'post-treatment',
    letterData.encounter.letterDate,
    {
      conditions: conditionIds,
      procedures: procedureIds,
      medications: medicationIds,
      observations: observationIds,
      treatmentPlanId,
      clinicalSummary: `
        58-year-old orthopaedic surgeon who underwent CABG x3 on 08/01/2025 following
        NSTEMI and triple vessel disease. Initial presentation with crushing chest pain
        and troponin rise. Successful revascularization performed: LIMA→LAD, Left Radial→OM2,
        LSV→distal RCA. Post-operative course complicated by chest infection, now resolved.

        Current status: Wounds healed, sternum stable, but experiencing ongoing sternal
        discomfort limiting range and power. On appropriate cardiac medication regimen.

        Plan: Continue rehabilitation. Work restrictions in place - not to return to
        orthopaedic surgery practice. Medication adjustments planned (cease Amlodipine
        at 6 months, stop Clopidogrel/Pantoprazole at 1 year, may titrate Ramipril).
      `,
      vitalSigns: {
        painLevel: 'moderate',
        functionalCapacity: 'limited',
        sternumStability: 'stable',
        woundHealing: 'complete',
      },
      labResults: {
        troponin: {
          initial: 66,
          peak: 350,
          unit: 'ng/L',
          date: '2024-12-31',
        },
      },
      functionalStatus: {
        rangeOfMotion: 'limited',
        powerStrength: 'limited',
        painRestriction: 'significant',
        workCapacity: 'unfit for orthopaedic surgery',
      },
      sourceDocuments: ['FollowUpLetter20250224.pdf'],
      notes: letterData.treatmentPlan.followUp,
    }
  );

  const summary = `
Digital Twin Baseline Created Successfully

Patient: ${letterData.patient.givenName} ${letterData.patient.familyName}
NHS Number: ${letterData.patient.nhsNumber}
Baseline Date: ${letterData.encounter.letterDate}

Entities Created:
- Patient Record: 1
- Conditions: ${conditionIds.length}
- Procedures: ${procedureIds.length}
- Medications: ${medicationIds.length}
- Observations: ${observationIds.length}
- Treatment Plan: 1
- Baseline Snapshot: 1

Key Diagnoses:
${letterData.diagnoses.map(d => `  • ${d.condition}`).join('\n')}

Key Procedures:
${letterData.procedures.map(p => `  • ${p.name} (${p.date})`).join('\n')}

Current Medications: ${medicationIds.length}

This baseline captures the post-operative state following CABG surgery and
establishes the foundation for tracking recovery, medication effectiveness,
and functional outcomes in the digital twin.
  `;

  return {
    patientId,
    baselineId,
    summary,
  };
}
