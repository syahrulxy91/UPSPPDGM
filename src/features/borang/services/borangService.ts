import { collection, getDocs, addDoc, orderBy, query, doc, setDoc, where, serverTimestamp } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../../../lib/firebase";
import { BorangRecord, BorangStatus } from "../../../types/borang";
import { getInstitusiList } from "../../institusi/services/institusiService";
import { createAuditLog } from "../../../shared/services/auditLogService";

export async function getBorangList(): Promise<BorangRecord[]> {
  const path = "borang";
  try {
    const q = query(collection(db, path));
    const snapshot = await getDocs(q);
    let list: BorangRecord[] = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        noRujukan: String(data.noRujukan ?? ""),
        institusiId: String(data.institusiId ?? ""),
        namaInstitusi: String(data.namaInstitusi ?? ""),
        jenisBorang: String(data.jenisBorang ?? ""),
        tarikhKemuka: String(data.tarikhKemuka ?? ""),
        status: (data.status ?? "dikemukakan") as BorangStatus,
        pegawai: String(data.pegawai ?? ""),
        jenisInstitusi: String(data.jenisInstitusi ?? ""),
        catatan: data.catatan ? String(data.catatan) : "",
        updatedAt: data.updatedAt ? String(data.updatedAt) : "",
        detailFields: data.detailFields || {}
      };
    });

    if (list.length === 0) {
      // Seed initial data synced with current institutions
      const institutions = await getInstitusiList();
      const defaultBorangs: Omit<BorangRecord, "id">[] = [];

      if (institutions.length > 0) {
        // We have real institutions, create synced items
        defaultBorangs.push(
          {
            noRujukan: "BPS-KPM/GM/" + Math.floor(1000 + Math.random() * 9000),
            institusiId: institutions[0].id,
            namaInstitusi: institutions[0].namaInstitusi,
            jenisBorang: "BPS II - Permohonan Pendaftaran IPS",
            tarikhKemuka: "2026-05-15",
            status: "diproses",
            pegawai: "Encik Ahmad Sukri Bin Ramli",
            jenisInstitusi: institutions[0].kategori,
            catatan: "Menunggu semakan dokumen bomba",
            updatedAt: "2026-05-31"
          },
          {
            noRujukan: "BPS-KPM/GM/" + Math.floor(1000 + Math.random() * 9000),
            institusiId: institutions[0].id,
            namaInstitusi: institutions[0].namaInstitusi,
            jenisBorang: "BPS IV - Permit Mengajar Guru",
            tarikhKemuka: "2026-05-28",
            status: "dikemukakan",
            pegawai: "Puan Noraini Binti Zakaria",
            jenisInstitusi: institutions[0].kategori,
            catatan: "Diterima melalui pos laju",
            updatedAt: "2026-05-31"
          }
        );

        if (institutions.length > 1) {
          defaultBorangs.push(
            {
              noRujukan: "BPS-KPM/GM/" + Math.floor(1000 + Math.random() * 9000),
              institusiId: institutions[1].id,
              namaInstitusi: institutions[1].namaInstitusi,
              jenisBorang: "BPS I - Borang Permohonan Penubuhan",
              tarikhKemuka: "2026-04-10",
              status: "lulus",
              pegawai: "Encik Ahmad Sukri Bin Ramli",
              jenisInstitusi: institutions[1].kategori,
              catatan: "Lulus bertarikh 05-05-2026",
              updatedAt: "2026-05-05"
            },
            {
              noRujukan: "BPS-KPM/GM/" + Math.floor(1000 + Math.random() * 9000),
              institusiId: institutions[1].id,
              namaInstitusi: institutions[1].namaInstitusi,
              jenisBorang: "BPS III - Pendaftaran Pengelola",
              tarikhKemuka: "2026-05-20",
              status: "tolak",
              pegawai: "Puan Noraini Binti Zakaria",
              jenisInstitusi: institutions[1].kategori,
              catatan: "Sijil kelayakan ROC pendaftar tidak disertakan",
              updatedAt: "2026-05-25"
            }
          );
        }

        if (institutions.length > 2) {
          defaultBorangs.push(
            {
              noRujukan: "BPS-KPM/GM/" + Math.floor(1000 + Math.random() * 9000),
              institusiId: institutions[2].id,
              namaInstitusi: institutions[2].namaInstitusi,
              jenisBorang: "BPS V - Pembaharuan Kelulusan Kebenaran",
              tarikhKemuka: "2026-05-30",
              status: "draf",
              pegawai: "Encik Ahmad Sukri Bin Ramli",
              jenisInstitusi: institutions[2].kategori,
              catatan: "Draf draf sementara",
              updatedAt: "2026-05-30"
            }
          );
        }
      } else {
        // Fallback static institutions
        defaultBorangs.push(
          {
            noRujukan: "BPS-KPM/GM/2051",
            institusiId: "fallback_01",
            namaInstitusi: "Tadika Islam Bestari Gua Musang",
            jenisBorang: "BPS II - Permohonan Pendaftaran IPS",
            tarikhKemuka: "2026-05-15",
            status: "diproses",
            pegawai: "Encik Ahmad Sukri Bin Ramli",
            jenisInstitusi: "tadika swasta",
            catatan: "Menunggu kelulusan Bomba",
            updatedAt: "2026-05-31"
          },
          {
            noRujukan: "BPS-KPM/GM/2052",
            institusiId: "fallback_02",
            namaInstitusi: "Pusat Tuisyen Intelek Gemilang",
            jenisBorang: "BPS IV - Permit Mengajar Guru",
            tarikhKemuka: "2026-05-20",
            status: "lulus",
            pegawai: "Puan Noraini Binti Zakaria",
            jenisInstitusi: "pusat tuisyen",
            catatan: "Permit lulus",
            updatedAt: "2026-05-25"
          }
        );
      }

      // Add them to Firestore
      for (const item of defaultBorangs) {
        try {
          const docRef = await addDoc(collection(db, path), {
            ...item,
            ipsId: item.institusiId,
            tarikh_kemuka: item.tarikhKemuka,
            createdAt: serverTimestamp()
          });
          list.push({ ...item, id: docRef.id });
        } catch (err) {
          console.error("Error adding seed borang", err);
        }
      }
    }

    return list.sort((a, b) => b.tarikhKemuka.localeCompare(a.tarikhKemuka));
  } catch (err: any) {
    handleFirestoreError(err, OperationType.LIST, path);
  }
}

export async function addBorangRecord(
  record: Omit<BorangRecord, "id">,
  performer?: { email: string; role: string }
): Promise<BorangRecord> {
  const path = "borang";
  try {
    const docRef = await addDoc(collection(db, path), {
      ...record,
      ipsId: record.institusiId,
      tarikh_kemuka: record.tarikhKemuka,
      createdAt: serverTimestamp(),
      updatedAt: new Date().toISOString().split("T")[0]
    });

    const isDraft = record.status === "draf";
    const actType = isDraft ? "simpan_draf" : "kemuka";
    const desc = isDraft 
      ? `Simpan draf borang ${record.jenisBorang} (No Rujukan: ${record.noRujukan})`
      : `Kemuka permohonan borang ${record.jenisBorang} (No Rujukan: ${record.noRujukan})`;

    await createAuditLog({
      entityType: "borang",
      entityId: docRef.id,
      actionType: actType,
      description: desc,
      performedBy: performer?.role || "pegawai_ppd",
      performedEmail: performer?.email || "unit.swasta@moe.gov.my",
      metadata: {
        noRujukan: record.noRujukan,
        namaInstitusi: record.namaInstitusi,
        status: record.status
      }
    });

    return {
      ...record,
      id: docRef.id,
      updatedAt: new Date().toISOString().split("T")[0]
    };
  } catch (err: any) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
}

export async function getBorangHistoryForIps(currentIpsId: string): Promise<BorangRecord[]> {
  const path = "borang";
  try {
    // Exact requested query: collection('borang').where('ipsId', '==', currentIpsId).orderBy('tarikh_kemuka', 'desc')
    const q = query(
      collection(db, path),
      where("ipsId", "==", currentIpsId),
      orderBy("tarikh_kemuka", "desc")
    );
    const snapshot = await getDocs(q);
    const list: BorangRecord[] = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        noRujukan: String(data.noRujukan ?? ""),
        institusiId: String(data.institusiId ?? data.ipsId ?? ""),
        namaInstitusi: String(data.namaInstitusi ?? ""),
        jenisBorang: String(data.jenisBorang ?? ""),
        tarikhKemuka: String(data.tarikhKemuka ?? data.tarikh_kemuka ?? ""),
        status: (data.status ?? "dikemukakan") as BorangStatus,
        pegawai: String(data.pegawai ?? ""),
        jenisInstitusi: String(data.jenisInstitusi ?? ""),
        catatan: data.catatan ? String(data.catatan) : "",
        updatedAt: data.updatedAt ? String(data.updatedAt) : "",
        detailFields: data.detailFields || {}
      };
    });
    return list;
  } catch (err: any) {
    // Sokongan tempatan sekiranya fungsi carian terus Firestore gagal (cth: indeks belum siap didirikan)
    console.warn("Carian terus Firestore gagal (indeks belum sedia), beralih kepada penapisan tempatan...", err);
    try {
      const allBorang = await getBorangList();
      return allBorang
        .filter((b) => b.institusiId === currentIpsId || (b as any).ipsId === currentIpsId)
        .sort((a, b) => b.tarikhKemuka.localeCompare(a.tarikhKemuka));
    } catch (fallbackErr) {
      handleFirestoreError(err, OperationType.LIST, path);
    }
  }
}

export async function updateBorangStatus(
  id: string, 
  status: BorangStatus, 
  catatan?: string,
  performer?: { email: string; role: string }
): Promise<void> {
  const path = "borang";
  try {
    const docRef = doc(db, path, id);
    const updates: any = {
      status,
      updatedAt: new Date().toISOString().split("T")[0]
    };
    if (catatan !== undefined) {
      updates.catatan = catatan;
    }
    await setDoc(docRef, updates, { merge: true });

    let actType: any = "tukar_status";
    if (status === "lulus") actType = "lulus";
    else if (status === "tolak") actType = "tolak";
    else if (status === "dikemukakan") actType = "kemuka";

    const catatanText = catatan ? ` (${catatan})` : "";
    await createAuditLog({
      entityType: "borang",
      entityId: id,
      actionType: actType,
      description: `Kemas kini status borang kepada ${status}${catatanText}`,
      performedBy: performer?.role || "pegawai_ppd",
      performedEmail: performer?.email || "unit.swasta@moe.gov.my",
      metadata: { status, catatan: catatan || null }
    });
  } catch (err: any) {
    handleFirestoreError(err, OperationType.UPDATE, `${path}/${id}`);
  }
}

export async function updateBorangRecord(
  id: string, 
  record: Partial<BorangRecord>,
  performer?: { email: string; role: string }
): Promise<void> {
  const path = "borang";
  try {
    const docRef = doc(db, path, id);
    const updates: any = {
      ...record,
      updatedAt: new Date().toISOString().split("T")[0]
    };
    delete updates.id; // ensure ID is not written inside the doc fields
    await setDoc(docRef, updates, { merge: true });

    await createAuditLog({
      entityType: "borang",
      entityId: id,
      actionType: "kemas_kini",
      description: `Kemas kini draf/maklumat borang ${record.jenisBorang || ""}`,
      performedBy: performer?.role || "pegawai_ppd",
      performedEmail: performer?.email || "unit.swasta@moe.gov.my",
      metadata: { modifiedFields: Object.keys(record) }
    });
  } catch (err: any) {
    handleFirestoreError(err, OperationType.UPDATE, `${path}/${id}`);
  }
}
