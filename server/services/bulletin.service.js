/**
 * =====================================================================
 *  BULLETINS SCOLAIRES (modele MINED)  -  TEMPLATE / A FAIRE
 *  ---------------------------------------------------------------------
 *  Le client realisera la mise en page officielle du bulletin MINED
 *  MANUELLEMENT. Ce fichier fournit seulement :
 *    1) la structure de donnees attendue (squelette) ;
 *    2) un agregateur de notes par eleve / periode, pret a brancher.
 *
 *  TODO (client) :
 *    - Caler le gabarit exact du bulletin officiel MINED (en-tete,
 *      logos, moyennes, mentions, signatures).
 *    - Choisir le rendu (PDF cote serveur, ou impression cote client).
 * =====================================================================
 */
import db from '../database/models.js';

const { Student, Enrollment, ClassSection, Subject } = db;

/**
 * Agrege les donnees brutes necessaires a un bulletin.
 * Renvoie un objet neutre (sans mise en page) que la couche d'edition
 * du bulletin pourra consommer.
 *
 * @param {string} studentId
 * @param {string} academicYearId
 * @param {string} period  ex : 'T1' | 'T2' | 'T3'
 */
export async function buildBulletinData(studentId, academicYearId, period) {
  const student = await Student.findByPk(studentId);
  if (!student) return null;

  const enrollment = await Enrollment.findOne({
    where: { studentId, academicYearId },
    include: [{ model: ClassSection }],
  });

  const subjects = enrollment?.ClassSection
    ? await Subject.findAll({ where: { cursoId: enrollment.ClassSection.cursoId, isActive: true } })
    : [];

  // Squelette : la recuperation/calcul des notes par matiere reste
  // a implementer selon la grille MINED retenue par le client.
  return {
    school: { name: 'WIWITRACK ESCOLA', ministry: 'MINED - Republica de Angola' },
    period,
    student: { id: student.id, fullName: student.fullName, matricule: student.matricule },
    classSection: enrollment?.ClassSection?.name || null,
    subjects: subjects.map((s) => ({
      subjectId: s.id,
      name: s.name,
      coefficient: Number(s.coefficient),
      // TODO : notes (MAC, PP, PT...) + moyenne, a brancher sur le module Notes
      grades: null,
      average: null,
    })),
    overallAverage: null, // TODO : calcul pondere par coefficient
    mention: null,        // TODO : regle de mention MINED
    _note: 'Gabarit MINED a finaliser manuellement par le client.',
  };
}
