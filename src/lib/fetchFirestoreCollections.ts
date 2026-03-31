/**
 * Firestore에서 3개 컬렉션 문서를 병렬로 가져와 id를 포함한 객체 배열로 반환
 */
import {
  collection,
  getDocs,
  type Firestore,
  type QuerySnapshot,
} from "firebase/firestore";

const COLLECTIONS = {
  failureCases: "failure_cases",
  reliabilityStandards: "reliability_standards",
  inspectionItems: "inspection_items",
};

function docsToList(snapshot: QuerySnapshot) {
  return snapshot.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  }));
}

export async function fetchAllCollectionsParallel(db: Firestore) {
  const [failureSnap, standardSnap, inspectionSnap] = await Promise.all([
    getDocs(collection(db, COLLECTIONS.failureCases)),
    getDocs(collection(db, COLLECTIONS.reliabilityStandards)),
    getDocs(collection(db, COLLECTIONS.inspectionItems)),
  ]);

  return {
    failureCases: docsToList(failureSnap),
    reliabilityStandards: docsToList(standardSnap),
    inspectionItems: docsToList(inspectionSnap),
  };
}

export { COLLECTIONS as FIRESTORE_COLLECTIONS };
