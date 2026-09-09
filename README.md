# NetExperience Network Academy

Simulateur de compréhension du réseau pour une personne à l’aise en logiciel, architecture, APIs et cloud,
mais dont les connaissances réseau sont incomplètes. Objectif : être rapidement crédible dans un environnement
OpenWiFi / OpenLAN comme NetExperience — définir les concepts, expliquer comment ils sont reliés, suivre le parcours
d’un client qui se connecte, et **localiser un problème dans la chaîne**.

Tout le contenu tourne autour d’une seule histoire : *« Mon téléphone se connecte au Wi-Fi. Que se passe-t-il ? »*

## Lancer

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # build de production dans dist/
npm test           # tests d’intégrité du contenu + moteur
npm run typecheck
```

Aucun backend : la progression (scores de maîtrise, leçons lues, labs, résultats) est stockée dans `localStorage`.

## Navigation

| Écran | Rôle |
| --- | --- |
| Dashboard | niveau global, score par domaine, concepts maîtrisés / fragiles, prochaine session recommandée |
| Learn | 8 modules (OSI, Ethernet/switching, IP, DHCP/ARP/DNS, Wi-Fi, VLAN, 802.1X/RADIUS, OpenWiFi) avec leçons, animations de protocoles et quiz |
| Network Journey | « Follow the packet » : 3 parcours cliquables (domestique, entreprise 802.1X, captive portal) avec vues Physical / Protocol / OSI / Packet / Device |
| Concept Map | graphe interactif des concepts (React Flow + dagre), relations typées, filtre par catégorie, recherche, « Comment A est relié à B ? » |
| Labs | 10 scénarios de troubleshooting : symptôme → où chercher → raisonnement attendu |
| Tests | diagnostic initial (30 q.), quiz de pratique adaptatif, mode Interview (réponses libres), examen final (50 q.) |
| Glossary | recherche instantanée sur les 86 termes |
| Reference | standards et projets officiels (RFC, IEEE, TIP, NetExperience) |

## Contenu data-driven

Aucun concept réseau n’est codé dans un composant React. Tout vit dans `/content` en JSON, validé par les tests :

```
content/
  concepts/     fiches (networking, switching, wifi, security, openwifi, operations)
  modules/      modules → leçons → blocs (paragraph, diagram, sequence, table, concepts, exercise, takeaways…)
  questions/    multiple-choice, ordering, matching, layer (OSI), troubleshooting, free-response
  scenarios/    labs de troubleshooting
  journeys/     parcours « Follow the packet »
  references.json
```

Les types sont dans `src/types/content.ts`. Chaque fiche suit la même structure : en une phrase, pourquoi ça existe,
qui parle à qui, quand, ports, séquence, si ça brise, concepts reliés, approfondir, sources.

## Moteur d’apprentissage

- Chaque concept a un score de maîtrise entre 0 et 1 (`src/engine/progress.ts`). Une bonne réponse le rapproche de 1,
  une erreur le réduit légèrement et augmente la priorité de révision du concept et de ses parents.
- Les recommandations (`src/engine/recommend.ts`) proposent le diagnostic, une révision ciblée des concepts fragiles,
  le prochain module dont les prérequis sont couverts, puis un lab et l’examen.
- Les réponses libres sont évaluées par détection des idées attendues (`src/engine/grading.ts`).
- Le graphe (`src/engine/graph.ts`) fournit voisins et plus court chemin entre deux concepts.

## Ajouter du contenu

Ajouter un fichier JSON dans le bon dossier de `/content` (les fichiers sont chargés par `import.meta.glob`),
puis `npm test` vérifie que toutes les références (concepts, questions, modules) se résolvent.
