import { Person, Gender } from '@/types';

export interface ExtendedRelative {
  person: Person;
  relationshipTitle: string;
  path: string[];
  distance: number;
}

type EdgeType = 'U' | 'D' | 'S';

interface Edge {
  to: string;
  type: EdgeType;
  gender?: Gender;
}

function getRelationshipTitle(path: string[], endGender: Gender | undefined, firstParentGender: Gender | undefined): string {
  const pStr = path.join(',');
  const isM = endGender === 'male';
  const isF = endGender === 'female';

  const suffix = firstParentGender === 'female' ? 'maternel(le)' : firstParentGender === 'male' ? 'paternel(le)' : '';
  const suffixM = firstParentGender === 'female' ? 'maternel' : firstParentGender === 'male' ? 'paternel' : '';
  const suffixF = firstParentGender === 'female' ? 'maternelle' : firstParentGender === 'male' ? 'paternelle' : '';

  const s = (str: string) => str.trim().replace(/ +/g, ' ');

  switch (pStr) {
    case 'U': return isM ? 'Père' : isF ? 'Mère' : 'Parent';
    case 'D': return isM ? 'Fils' : isF ? 'Fille' : 'Enfant';
    case 'S': return isM ? 'Époux' : isF ? 'Épouse' : 'Conjoint(e)';
    case 'U,D': return isM ? 'Frère' : isF ? 'Sœur' : 'Fratrie';
    case 'U,U': return s(isM ? `Grand-père ${suffixM}` : isF ? `Grand-mère ${suffixF}` : `Grand-parent ${suffix}`);
    case 'D,D': return isM ? 'Petit-fils' : isF ? 'Petite-fille' : 'Petit-enfant';
    case 'U,U,D': return s(isM ? `Oncle ${suffixM}` : isF ? `Tante ${suffixF}` : `Oncle/Tante ${suffix}`);
    case 'U,U,D,D': return s(isM ? `Cousin ${suffixM}` : isF ? `Cousine ${suffixF}` : `Cousin(e) ${suffix}`);
    case 'U,D,D': return isM ? 'Neveu' : isF ? 'Nièce' : 'Neveu/Nièce';
    case 'U,U,U': return isM ? `Arrière-grand-père` : isF ? `Arrière-grand-mère` : `Arrière-grand-parent`;
    case 'D,D,D': return isM ? 'Arrière-petit-fils' : isF ? 'Arrière-petite-fille' : 'Arrière-petit-enfant';
    case 'S,U': return isM ? 'Beau-père' : isF ? 'Belle-mère' : 'Beau-parent';
    case 'S,D': return isM ? 'Beau-fils' : isF ? 'Belle-fille' : 'Beau-fils/fille';
    case 'U,S': return isM ? 'Beau-père' : isF ? 'Belle-mère' : 'Beau-parent';
    case 'S,U,D': return isM ? 'Beau-frère' : isF ? 'Belle-sœur' : 'Beau-frère/sœur';
    case 'U,D,S': return isM ? 'Beau-frère' : isF ? 'Belle-sœur' : 'Beau-frère/sœur';
  }

  if (path.every(p => p === 'U')) return 'Ancêtre';
  if (path.every(p => p === 'D')) return 'Descendant';

  return 'Parent éloigné';
}

export function getExtendedRelatives(centerId: string, persons: Person[]): ExtendedRelative[] {
  const graph = new Map<string, Edge[]>();

  const addEdge = (from: string, to: string, type: EdgeType, gender?: Gender) => {
    if (!graph.has(from)) graph.set(from, []);
    // avoid duplicates
    if (!graph.get(from)!.find(e => e.to === to && e.type === type)) {
      graph.get(from)!.push({ to, type, gender });
    }
  };

  persons.forEach(p => {
    if (p.parentId1) {
      const parent1 = persons.find(x => x.id === p.parentId1);
      addEdge(p.id, p.parentId1, 'U', parent1?.gender);
      addEdge(p.parentId1, p.id, 'D', p.gender);
    }
    if (p.parentId2) {
      const parent2 = persons.find(x => x.id === p.parentId2);
      addEdge(p.id, p.parentId2, 'U', parent2?.gender);
      addEdge(p.parentId2, p.id, 'D', p.gender);
    }
    if (p.spouseId) {
      const spouse = persons.find(x => x.id === p.spouseId);
      addEdge(p.id, p.spouseId, 'S', spouse?.gender);
      addEdge(p.spouseId, p.id, 'S', p.gender);
    }
    // Check others referring to this person as spouse
    const spouses = persons.filter(x => x.spouseId === p.id);
    spouses.forEach(s => {
      addEdge(p.id, s.id, 'S', s.gender);
      addEdge(s.id, p.id, 'S', p.gender);
    });
  });

  const visited = new Set<string>();
  const queue: { id: string; path: EdgeType[]; firstParentGender?: Gender }[] = [];

  visited.add(centerId);
  queue.push({ id: centerId, path: [] });

  const relatives: ExtendedRelative[] = [];

  while (queue.length > 0) {
    const { id, path, firstParentGender } = queue.shift()!;

    if (id !== centerId) {
      const person = persons.find(p => p.id === id);
      if (person) {
        relatives.push({
          person,
          relationshipTitle: getRelationshipTitle(path, person.gender, firstParentGender),
          path,
          distance: path.length,
        });
      }
    }

    const neighbors = graph.get(id) || [];
    for (const edge of neighbors) {
      if (!visited.has(edge.to)) {
        visited.add(edge.to);
        const newPath = [...path, edge.type];
        let newFirstParentGender = firstParentGender;
        if (path.length === 0 && edge.type === 'U') {
          newFirstParentGender = edge.gender;
        }
        queue.push({ id: edge.to, path: newPath, firstParentGender: newFirstParentGender });
      }
    }
  }

  return relatives;
}
