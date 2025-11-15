import { Store, DataFactory, Writer, Parser } from 'n3';

const { namedNode, literal, quad } = DataFactory;

export interface FHIRResource {
  resourceType: string;
  id: string;
  meta?: {
    versionId?: string;
    lastUpdated?: string;
  };
  [key: string]: unknown;
}

export interface MedicalCoding {
  system: string;
  code: string;
  display: string;
}

export interface LabResult {
  id: string;
  patientId: string;
  date: string;
  loincCode: string;
  loincDisplay: string;
  value: string;
  unit?: string;
  interpretation?: string;
}

export interface Diagnosis {
  id: string;
  patientId: string;
  date: string;
  icd10Code: string;
  icd10Display: string;
  clinicalStatus: string;
  verificationStatus: string;
}

export interface Observation {
  id: string;
  patientId: string;
  date: string;
  snomedCode?: string;
  snomedDisplay?: string;
  loincCode?: string;
  loincDisplay?: string;
  value: string;
  category: string;
}

const FHIR_NAMESPACE = 'http://hl7.org/fhir/';
const LOINC_NAMESPACE = 'http://loinc.org/';
const ICD10_NAMESPACE = 'http://hl7.org/fhir/sid/icd-10/';
const SNOMED_NAMESPACE = 'http://snomed.info/sct/';
const RDF_NAMESPACE = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#';
const RDFS_NAMESPACE = 'http://www.w3.org/2000/01/rdf-schema#';

export class FHIRRDFService {
  private store: Store;

  constructor() {
    this.store = new Store();
  }

  convertFHIRToRDF(resource: FHIRResource): string {
    const store = new Store();
    const resourceUri = namedNode(`${FHIR_NAMESPACE}${resource.resourceType}/${resource.id}`);

    store.addQuad(
      resourceUri,
      namedNode(`${RDF_NAMESPACE}type`),
      namedNode(`${FHIR_NAMESPACE}${resource.resourceType}`)
    );

    if (resource.meta?.lastUpdated) {
      store.addQuad(
        resourceUri,
        namedNode(`${FHIR_NAMESPACE}meta.lastUpdated`),
        literal(resource.meta.lastUpdated)
      );
    }

    this.addResourceProperties(store, resourceUri, resource);

    const writer = new Writer();
    return writer.quadsToString(store.getQuads(null, null, null, null));
  }

  private addResourceProperties(store: Store, subject: any, obj: any, prefix = ''): void {
    Object.entries(obj).forEach(([key, value]) => {
      if (key === 'id' || key === 'resourceType' || key === 'meta') return;

      const predicate = namedNode(`${FHIR_NAMESPACE}${prefix}${key}`);

      if (value === null || value === undefined) {
        return;
      } else if (typeof value === 'object' && !Array.isArray(value)) {
        const blankNode = DataFactory.blankNode();
        store.addQuad(subject, predicate, blankNode);
        this.addResourceProperties(store, blankNode, value, `${key}.`);
      } else if (Array.isArray(value)) {
        value.forEach((item, index) => {
          if (typeof item === 'object') {
            const blankNode = DataFactory.blankNode();
            store.addQuad(subject, predicate, blankNode);
            this.addResourceProperties(store, blankNode, item, `${key}.`);
          } else {
            store.addQuad(subject, predicate, literal(String(item)));
          }
        });
      } else {
        store.addQuad(subject, predicate, literal(String(value)));
      }
    });
  }

  createLabResultRDF(labResult: LabResult): string {
    const store = new Store();
    const observationUri = namedNode(`${FHIR_NAMESPACE}Observation/${labResult.id}`);

    store.addQuad(
      observationUri,
      namedNode(`${RDF_NAMESPACE}type`),
      namedNode(`${FHIR_NAMESPACE}Observation`)
    );

    store.addQuad(
      observationUri,
      namedNode(`${FHIR_NAMESPACE}subject`),
      namedNode(`${FHIR_NAMESPACE}Patient/${labResult.patientId}`)
    );

    store.addQuad(
      observationUri,
      namedNode(`${FHIR_NAMESPACE}effectiveDateTime`),
      literal(labResult.date)
    );

    const codingNode = DataFactory.blankNode();
    store.addQuad(
      observationUri,
      namedNode(`${FHIR_NAMESPACE}code`),
      codingNode
    );

    store.addQuad(
      codingNode,
      namedNode(`${FHIR_NAMESPACE}coding.system`),
      namedNode(LOINC_NAMESPACE)
    );

    store.addQuad(
      codingNode,
      namedNode(`${FHIR_NAMESPACE}coding.code`),
      literal(labResult.loincCode)
    );

    store.addQuad(
      codingNode,
      namedNode(`${FHIR_NAMESPACE}coding.display`),
      literal(labResult.loincDisplay)
    );

    store.addQuad(
      codingNode,
      namedNode(`${RDFS_NAMESPACE}seeAlso`),
      namedNode(`${LOINC_NAMESPACE}${labResult.loincCode}`)
    );

    const valueNode = DataFactory.blankNode();
    store.addQuad(
      observationUri,
      namedNode(`${FHIR_NAMESPACE}valueQuantity`),
      valueNode
    );

    store.addQuad(
      valueNode,
      namedNode(`${FHIR_NAMESPACE}value`),
      literal(labResult.value)
    );

    if (labResult.unit) {
      store.addQuad(
        valueNode,
        namedNode(`${FHIR_NAMESPACE}unit`),
        literal(labResult.unit)
      );
    }

    if (labResult.interpretation) {
      store.addQuad(
        observationUri,
        namedNode(`${FHIR_NAMESPACE}interpretation`),
        literal(labResult.interpretation)
      );
    }

    const writer = new Writer({ format: 'Turtle' });
    return writer.quadsToString(store.getQuads(null, null, null, null));
  }

  createDiagnosisRDF(diagnosis: Diagnosis): string {
    const store = new Store();
    const conditionUri = namedNode(`${FHIR_NAMESPACE}Condition/${diagnosis.id}`);

    store.addQuad(
      conditionUri,
      namedNode(`${RDF_NAMESPACE}type`),
      namedNode(`${FHIR_NAMESPACE}Condition`)
    );

    store.addQuad(
      conditionUri,
      namedNode(`${FHIR_NAMESPACE}subject`),
      namedNode(`${FHIR_NAMESPACE}Patient/${diagnosis.patientId}`)
    );

    store.addQuad(
      conditionUri,
      namedNode(`${FHIR_NAMESPACE}recordedDate`),
      literal(diagnosis.date)
    );

    store.addQuad(
      conditionUri,
      namedNode(`${FHIR_NAMESPACE}clinicalStatus`),
      literal(diagnosis.clinicalStatus)
    );

    store.addQuad(
      conditionUri,
      namedNode(`${FHIR_NAMESPACE}verificationStatus`),
      literal(diagnosis.verificationStatus)
    );

    const codingNode = DataFactory.blankNode();
    store.addQuad(
      conditionUri,
      namedNode(`${FHIR_NAMESPACE}code`),
      codingNode
    );

    store.addQuad(
      codingNode,
      namedNode(`${FHIR_NAMESPACE}coding.system`),
      namedNode(ICD10_NAMESPACE)
    );

    store.addQuad(
      codingNode,
      namedNode(`${FHIR_NAMESPACE}coding.code`),
      literal(diagnosis.icd10Code)
    );

    store.addQuad(
      codingNode,
      namedNode(`${FHIR_NAMESPACE}coding.display`),
      literal(diagnosis.icd10Display)
    );

    store.addQuad(
      codingNode,
      namedNode(`${RDFS_NAMESPACE}seeAlso`),
      namedNode(`${ICD10_NAMESPACE}${diagnosis.icd10Code}`)
    );

    const writer = new Writer({ format: 'Turtle' });
    return writer.quadsToString(store.getQuads(null, null, null, null));
  }

  createObservationRDF(observation: Observation): string {
    const store = new Store();
    const observationUri = namedNode(`${FHIR_NAMESPACE}Observation/${observation.id}`);

    store.addQuad(
      observationUri,
      namedNode(`${RDF_NAMESPACE}type`),
      namedNode(`${FHIR_NAMESPACE}Observation`)
    );

    store.addQuad(
      observationUri,
      namedNode(`${FHIR_NAMESPACE}subject`),
      namedNode(`${FHIR_NAMESPACE}Patient/${observation.patientId}`)
    );

    store.addQuad(
      observationUri,
      namedNode(`${FHIR_NAMESPACE}effectiveDateTime`),
      literal(observation.date)
    );

    store.addQuad(
      observationUri,
      namedNode(`${FHIR_NAMESPACE}category`),
      literal(observation.category)
    );

    const codingNode = DataFactory.blankNode();
    store.addQuad(
      observationUri,
      namedNode(`${FHIR_NAMESPACE}code`),
      codingNode
    );

    if (observation.snomedCode) {
      store.addQuad(
        codingNode,
        namedNode(`${FHIR_NAMESPACE}coding.system`),
        namedNode(SNOMED_NAMESPACE)
      );

      store.addQuad(
        codingNode,
        namedNode(`${FHIR_NAMESPACE}coding.code`),
        literal(observation.snomedCode)
      );

      if (observation.snomedDisplay) {
        store.addQuad(
          codingNode,
          namedNode(`${FHIR_NAMESPACE}coding.display`),
          literal(observation.snomedDisplay)
        );
      }

      store.addQuad(
        codingNode,
        namedNode(`${RDFS_NAMESPACE}seeAlso`),
        namedNode(`${SNOMED_NAMESPACE}${observation.snomedCode}`)
      );
    }

    if (observation.loincCode) {
      const loincCodingNode = DataFactory.blankNode();
      store.addQuad(
        observationUri,
        namedNode(`${FHIR_NAMESPACE}code`),
        loincCodingNode
      );

      store.addQuad(
        loincCodingNode,
        namedNode(`${FHIR_NAMESPACE}coding.system`),
        namedNode(LOINC_NAMESPACE)
      );

      store.addQuad(
        loincCodingNode,
        namedNode(`${FHIR_NAMESPACE}coding.code`),
        literal(observation.loincCode)
      );

      if (observation.loincDisplay) {
        store.addQuad(
          loincCodingNode,
          namedNode(`${FHIR_NAMESPACE}coding.display`),
          literal(observation.loincDisplay)
        );
      }
    }

    store.addQuad(
      observationUri,
      namedNode(`${FHIR_NAMESPACE}valueString`),
      literal(observation.value)
    );

    const writer = new Writer({ format: 'Turtle' });
    return writer.quadsToString(store.getQuads(null, null, null, null));
  }

  parseRDFToFHIR(rdfString: string): Promise<FHIRResource[]> {
    return new Promise((resolve, reject) => {
      const parser = new Parser({ format: 'Turtle' });
      const store = new Store();
      const resources: FHIRResource[] = [];

      parser.parse(rdfString, (error, quad, prefixes) => {
        if (error) {
          reject(error);
          return;
        }

        if (quad) {
          store.addQuad(quad);
        } else {
          const resourceSubjects = store.getSubjects(
            namedNode(`${RDF_NAMESPACE}type`),
            null,
            null
          );

          resourceSubjects.forEach(subject => {
            const typeQuads = store.getQuads(
              subject,
              namedNode(`${RDF_NAMESPACE}type`),
              null,
              null
            );

            if (typeQuads.length > 0) {
              const resourceType = typeQuads[0].object.value.replace(FHIR_NAMESPACE, '');
              const id = subject.value.split('/').pop() || '';

              const resource: FHIRResource = {
                resourceType,
                id,
              };

              const predicateQuads = store.getQuads(subject, null, null, null);
              predicateQuads.forEach(q => {
                const predicate = q.predicate.value.replace(FHIR_NAMESPACE, '');
                if (predicate !== 'type' && !predicate.startsWith('http://')) {
                  resource[predicate] = q.object.value;
                }
              });

              resources.push(resource);
            }
          });

          resolve(resources);
        }
      });
    });
  }

  exportToTurtle(resources: FHIRResource[]): string {
    const store = new Store();

    resources.forEach(resource => {
      const resourceUri = namedNode(`${FHIR_NAMESPACE}${resource.resourceType}/${resource.id}`);

      store.addQuad(
        resourceUri,
        namedNode(`${RDF_NAMESPACE}type`),
        namedNode(`${FHIR_NAMESPACE}${resource.resourceType}`)
      );

      this.addResourceProperties(store, resourceUri, resource);
    });

    const writer = new Writer({
      format: 'Turtle',
      prefixes: {
        fhir: FHIR_NAMESPACE,
        loinc: LOINC_NAMESPACE,
        icd10: ICD10_NAMESPACE,
        snomed: SNOMED_NAMESPACE,
        rdf: RDF_NAMESPACE,
        rdfs: RDFS_NAMESPACE,
      },
    });

    return writer.quadsToString(store.getQuads(null, null, null, null));
  }

  lookupLOINCCode(code: string): { code: string; display: string; description: string } | null {
    const commonLOINC: Record<string, { display: string; description: string }> = {
      '2093-3': {
        display: 'Cholesterol [Mass/volume] in Serum or Plasma',
        description: 'Total cholesterol measurement',
      },
      '2571-8': {
        display: 'Triglyceride [Mass/volume] in Serum or Plasma',
        description: 'Triglycerides measurement',
      },
      '2345-7': {
        display: 'Glucose [Mass/volume] in Serum or Plasma',
        description: 'Blood glucose measurement',
      },
      '718-7': {
        display: 'Hemoglobin [Mass/volume] in Blood',
        description: 'Hemoglobin concentration',
      },
      '789-8': {
        display: 'Erythrocytes [#/volume] in Blood by Automated count',
        description: 'Red blood cell count',
      },
    };

    if (commonLOINC[code]) {
      return {
        code,
        ...commonLOINC[code],
      };
    }

    return null;
  }

  lookupICD10Code(code: string): { code: string; display: string; description: string } | null {
    const commonICD10: Record<string, { display: string; description: string }> = {
      'E11': {
        display: 'Type 2 diabetes mellitus',
        description: 'Non-insulin-dependent diabetes mellitus',
      },
      'I10': {
        display: 'Essential (primary) hypertension',
        description: 'High blood pressure',
      },
      'E78.5': {
        display: 'Hyperlipidemia, unspecified',
        description: 'Abnormally elevated levels of lipids in the blood',
      },
      'J06.9': {
        display: 'Acute upper respiratory infection, unspecified',
        description: 'Common cold or similar infection',
      },
      'M54.5': {
        display: 'Low back pain',
        description: 'Pain in the lower back region',
      },
    };

    if (commonICD10[code]) {
      return {
        code,
        ...commonICD10[code],
      };
    }

    return null;
  }

  lookupSNOMEDCode(code: string): { code: string; display: string; description: string } | null {
    const commonSNOMED: Record<string, { display: string; description: string }> = {
      '386661006': {
        display: 'Fever',
        description: 'Elevated body temperature',
      },
      '267036007': {
        display: 'Dyspnea',
        description: 'Difficulty breathing or shortness of breath',
      },
      '22253000': {
        display: 'Pain',
        description: 'Unpleasant sensory experience',
      },
      '84229001': {
        display: 'Fatigue',
        description: 'Extreme tiredness or exhaustion',
      },
      '25064002': {
        display: 'Headache',
        description: 'Pain in the head region',
      },
    };

    if (commonSNOMED[code]) {
      return {
        code,
        ...commonSNOMED[code],
      };
    }

    return null;
  }
}

export const fhirRDFService = new FHIRRDFService();
