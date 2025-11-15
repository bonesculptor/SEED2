import { SupabaseClient } from '@supabase/supabase-js';
import { GraphRepository, CreateNodeData, CreateEdgeData } from '../domain/repositories/GraphRepository';
import { PatientRepository } from '../domain/repositories/PatientRepository';
import { MedicalRecordRepository } from '../domain/repositories/MedicalRecordRepository';

export class GraphService {
  private graphRepository: GraphRepository;
  private patientRepository: PatientRepository;
  private medicalRecordRepository: MedicalRecordRepository;

  constructor(supabaseClient: SupabaseClient) {
    this.graphRepository = new GraphRepository(supabaseClient);
    this.patientRepository = new PatientRepository(supabaseClient);
    this.medicalRecordRepository = new MedicalRecordRepository(supabaseClient);
  }

  async getGraph(userId: string) {
    const [nodes, edges] = await Promise.all([
      this.graphRepository.getNodes(userId),
      this.graphRepository.getEdges(userId),
    ]);

    return { nodes, edges };
  }

  async createNode(userId: string, nodeData: CreateNodeData) {
    return this.graphRepository.createNode(userId, nodeData);
  }

  async createEdge(userId: string, edgeData: CreateEdgeData) {
    return this.graphRepository.createEdge(userId, edgeData);
  }

  async rebuildGraphFromMedicalRecords(userId: string): Promise<void> {
    await this.graphRepository.deleteAllEdges(userId);
    await this.graphRepository.deleteAllNodes(userId);

    const patients = await this.patientRepository.findByUserId(userId);
    const [medications, conditions, observations, allergies] = await Promise.all([
      this.medicalRecordRepository.getMedications(userId),
      this.medicalRecordRepository.getConditions(userId),
      this.medicalRecordRepository.getObservations(userId),
      this.medicalRecordRepository.getAllergies(userId),
    ]);

    const nodeIdMap = new Map<string, string>();

    for (const patient of patients) {
      const node = await this.createNode(userId, {
        label: `${patient.givenName} ${patient.familyName}`,
        nodeType: 'Patient',
        properties: {
          birthDate: patient.birthDate,
          gender: patient.gender,
          nhsNumber: patient.nhsNumber,
        },
      });
      nodeIdMap.set(`patient_${patient.id}`, node.id);
    }

    for (const medication of medications) {
      const node = await this.createNode(userId, {
        label: medication.medicationText,
        nodeType: 'Medication',
        properties: {
          dosage: medication.dosage,
          frequency: medication.frequency,
          status: medication.status,
        },
      });
      nodeIdMap.set(`medication_${medication.id}`, node.id);

      if (medication.patientId) {
        const patientNodeId = nodeIdMap.get(`patient_${medication.patientId}`);
        if (patientNodeId) {
          await this.createEdge(userId, {
            source: patientNodeId,
            target: node.id,
            relationship: 'takes',
          });
        }
      }
    }

    for (const condition of conditions) {
      const node = await this.createNode(userId, {
        label: condition.conditionText,
        nodeType: 'Condition',
        properties: {
          clinicalStatus: condition.clinicalStatus,
          onsetDate: condition.onsetDate,
        },
      });
      nodeIdMap.set(`condition_${condition.id}`, node.id);

      if (condition.patientId) {
        const patientNodeId = nodeIdMap.get(`patient_${condition.patientId}`);
        if (patientNodeId) {
          await this.createEdge(userId, {
            source: patientNodeId,
            target: node.id,
            relationship: 'has',
          });
        }
      }
    }

    for (const observation of observations) {
      const node = await this.createNode(userId, {
        label: observation.observationText,
        nodeType: 'Observation',
        properties: {
          value: observation.value,
          unit: observation.unit,
          observationDate: observation.observationDate,
        },
      });
      nodeIdMap.set(`observation_${observation.id}`, node.id);

      if (observation.patientId) {
        const patientNodeId = nodeIdMap.get(`patient_${observation.patientId}`);
        if (patientNodeId) {
          await this.createEdge(userId, {
            source: patientNodeId,
            target: node.id,
            relationship: 'observed',
          });
        }
      }
    }

    for (const allergy of allergies) {
      const node = await this.createNode(userId, {
        label: allergy.allergyText,
        nodeType: 'Allergy',
        properties: {
          criticality: allergy.criticality,
        },
      });
      nodeIdMap.set(`allergy_${allergy.id}`, node.id);

      if (allergy.patientId) {
        const patientNodeId = nodeIdMap.get(`patient_${allergy.patientId}`);
        if (patientNodeId) {
          await this.createEdge(userId, {
            source: patientNodeId,
            target: node.id,
            relationship: 'allergic_to',
          });
        }
      }
    }
  }

  async clearGraph(userId: string): Promise<void> {
    await this.graphRepository.deleteAllEdges(userId);
    await this.graphRepository.deleteAllNodes(userId);
  }
}
