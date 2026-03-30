"""
Bibliothèque de scénarios narratifs pour Infinity Story Game.

Chaque situation est un dictionnaire contenant :
  - id          : identifiant unique
  - theme       : catégorie (ville, forêt, donjon, marché, rencontre, combat, mystère, trahison, ...)
  - min_rep     : réputation minimale requise (défaut -100)
  - max_rep     : réputation maximale requise (défaut 100)
  - min_argent  : argent minimal requis (défaut 0)
  - min_influence : influence minimale requise (défaut 0)
  - classes     : liste de classes concernées (vide = toutes)
  - text        : texte de la situation (supporte {nom}, {classe_text}, {reputation_text}, {argent}, {influence})
  - choices     : liste de 3 choix, chacun avec :
      - text            : texte du choix
      - reputation_delta
      - argent_delta
      - influence_delta
"""

SITUATIONS: list[dict] = [
    # ── VILLE ──────────────────────────────────────────────────────────────
    {
        "id": "ville_taverne",
        "theme": "ville",
        "text": (
            "La lueur des torches danse sur les murs de la taverne «\u202fL'Ancre Dorée\u202f». "
            "Des murmures s'arrêtent à ton entrée — ta réputation {reputation_text} te précède. "
            "Un homme encapuchonné te fait signe depuis l'ombre d'un coin reculé."
        ),
        "choices": [
            {
                "text": "Tu t'approches prudemment et tu l'écoutes.",
                "reputation_delta": 0,
                "argent_delta": 0,
                "influence_delta": 5,
            },
            {
                "text": "Tu l'ignores et commandes une bière, observant la salle.",
                "reputation_delta": 0,
                "argent_delta": -3,
                "influence_delta": 0,
            },
            {
                "text": "Tu t'assieds bruyamment à côté de lui et exiges des explications.",
                "reputation_delta": -5,
                "argent_delta": 0,
                "influence_delta": 0,
            },
        ],
    },
    {
        "id": "ville_garde",
        "theme": "ville",
        "text": (
            "Au détour d'une ruelle pavée, deux gardes de la cité bloquent ton chemin. "
            "L'un d'eux crache par terre. «\u202fOn nous a signalé un {classe_text} louche dans le coin.\u202f» "
            "Ses yeux méfiants te jaugent de la tête aux pieds."
        ),
        "choices": [
            {
                "text": "Tu montres tes papiers et adoptes une attitude coopérative.",
                "reputation_delta": 5,
                "argent_delta": 0,
                "influence_delta": 0,
            },
            {
                "text": "Tu glisses quelques pièces dans la main du garde sans un mot.",
                "reputation_delta": -5,
                "argent_delta": -10,
                "influence_delta": 0,
            },
            {
                "text": "Tu récites une loi que tu inventes d'un air assuré, et tu passes.",
                "reputation_delta": 0,
                "argent_delta": 0,
                "influence_delta": 10,
            },
        ],
    },
    {
        "id": "ville_enfant",
        "theme": "ville",
        "text": (
            "Un enfant déguenillé te tire par la manche. «\u202fSieur {nom}, ma mère est malade et on n'a "
            "plus rien à manger.\u202f» Ses grands yeux brillent de larmes retenues. Autour de vous, "
            "des passants observent ta réaction."
        ),
        "choices": [
            {
                "text": "Tu lui donnes généreusement de la nourriture et quelques pièces.",
                "reputation_delta": 15,
                "argent_delta": -15,
                "influence_delta": 5,
            },
            {
                "text": "Tu lui donnes une seule pièce, ce que tu peux te permettre.",
                "reputation_delta": 5,
                "argent_delta": -5,
                "influence_delta": 0,
            },
            {
                "text": "Tu l'ignores et continues ton chemin.",
                "reputation_delta": -10,
                "argent_delta": 0,
                "influence_delta": -5,
            },
        ],
    },
    {
        "id": "ville_noble",
        "theme": "ville",
        "text": (
            "Un noble en habit cramoisi te barre la route. «\u202fJ'ai entendu parler de toi, {nom}. "
            "Quelqu'un de ton… envergure pourrait m'être utile.\u202f» Il parle d'une mission discrète "
            "qui pourrait te rapporter gros — ou te coûter ta liberté."
        ),
        "min_influence": 20,
        "choices": [
            {
                "text": "Tu acceptes la mission avec enthousiasme.",
                "reputation_delta": 0,
                "argent_delta": 0,
                "influence_delta": 15,
            },
            {
                "text": "Tu négocies une avance en or avant d'accepter.",
                "reputation_delta": 0,
                "argent_delta": 30,
                "influence_delta": 5,
            },
            {
                "text": "Tu déclins poliment, refusant de te lier à un noble.",
                "reputation_delta": 10,
                "argent_delta": 0,
                "influence_delta": -5,
            },
        ],
    },
    {
        "id": "ville_incendie",
        "theme": "ville",
        "text": (
            "Des cris percent la nuit — un bâtiment est en flammes ! Les habitants accourent "
            "en panique. Au milieu du chaos, tu aperçois une bourse tombée par terre et "
            "une famille coincée à l'étage. Tu dois choisir vite."
        ),
        "choices": [
            {
                "text": "Tu plonges dans les flammes pour sauver la famille.",
                "reputation_delta": 25,
                "argent_delta": -5,
                "influence_delta": 15,
            },
            {
                "text": "Tu organises les secours et coordonnes les efforts.",
                "reputation_delta": 15,
                "argent_delta": 0,
                "influence_delta": 20,
            },
            {
                "text": "Tu ramasses la bourse dans la confusion générale.",
                "reputation_delta": -20,
                "argent_delta": 40,
                "influence_delta": -10,
            },
        ],
    },
    # ── FORÊT ──────────────────────────────────────────────────────────────
    {
        "id": "foret_bandit",
        "theme": "forêt",
        "text": (
            "Le sentier forestier s'assombrit sous l'épais feuillage. Un sifflement strident "
            "retentit — et soudain cinq bandits armés surgissent des buissons. "
            "Leur chef ricane. «\u202fTon argent ou ta vie, {nom}.\u202f»"
        ),
        "choices": [
            {
                "text": "Tu dégaines et attaques le chef par surprise.",
                "reputation_delta": 5,
                "argent_delta": 20,
                "influence_delta": 10,
            },
            {
                "text": "Tu négocie : tu leur offres la moitié de ton argent.",
                "reputation_delta": -5,
                "argent_delta": -25,
                "influence_delta": 0,
            },
            {
                "text": "Tu tentes de fuir à travers la forêt en courant.",
                "reputation_delta": -10,
                "argent_delta": 0,
                "influence_delta": -5,
            },
        ],
    },
    {
        "id": "foret_elfe",
        "theme": "forêt",
        "text": (
            "Une silhouette gracile se matérialise entre les arbres millénaires — une elfe "
            "aux yeux d'ambre. «\u202fCes bois ont une mémoire, {nom}. "
            "Ils me racontent ce que tu as fait.\u202f» Son regard sonde ton âme."
        ),
        "choices": [
            {
                "text": "Tu lui parles honnêtement de ton passé sans rien cacher.",
                "reputation_delta": 10,
                "argent_delta": 0,
                "influence_delta": 10,
            },
            {
                "text": "Tu lui demandes ce que les arbres lui ont dit exactement.",
                "reputation_delta": 0,
                "argent_delta": 0,
                "influence_delta": 5,
            },
            {
                "text": "Tu refuses de te justifier et passes ton chemin.",
                "reputation_delta": -5,
                "argent_delta": 0,
                "influence_delta": -5,
            },
        ],
    },
    {
        "id": "foret_trésor",
        "theme": "forêt",
        "text": (
            "Sous un vieux chêne foudroyé, tu découvres une cassette en bois gravée de runes. "
            "Elle contient des pièces d'or et un parchemin — une carte au trésor. "
            "Mais une croix fraîche sur le sol indique que quelqu'un viendra reprendre son dû."
        ),
        "choices": [
            {
                "text": "Tu prends tout — finders keepers.",
                "reputation_delta": -10,
                "argent_delta": 60,
                "influence_delta": 0,
            },
            {
                "text": "Tu prends seulement la carte et laisses l'or.",
                "reputation_delta": 5,
                "argent_delta": 0,
                "influence_delta": 10,
            },
            {
                "text": "Tu t'installes et attends le propriétaire pour négocier.",
                "reputation_delta": 10,
                "argent_delta": 20,
                "influence_delta": 5,
            },
        ],
    },
    {
        "id": "foret_loup",
        "theme": "forêt",
        "text": (
            "Un loup gigantesque sort des ombres, ses yeux brillant d'une lueur intelligente. "
            "Il ne t'attaque pas — il te fixe, la tête inclinée. "
            "Sur son flanc, une vieille blessure mal cicatrisée saigne encore."
        ),
        "choices": [
            {
                "text": "Tu soignes doucement la blessure du loup.",
                "reputation_delta": 10,
                "argent_delta": -5,
                "influence_delta": 10,
            },
            {
                "text": "Tu recules lentement sans le quitter des yeux.",
                "reputation_delta": 0,
                "argent_delta": 0,
                "influence_delta": 0,
            },
            {
                "text": "Tu l'attaques, craignant une embuscade.",
                "reputation_delta": -15,
                "argent_delta": 0,
                "influence_delta": -10,
            },
        ],
    },
    # ── DONJON ─────────────────────────────────────────────────────────────
    {
        "id": "donjon_porte",
        "theme": "donjon",
        "text": (
            "Les profondeurs du donjon sentent la terre humide et la mort ancienne. "
            "Face à toi, trois portes : l'une est verrouillée avec des runes de feu, "
            "l'une murmure étrangement, et la dernière semble normale — trop normale."
        ),
        "choices": [
            {
                "text": "Tu forces la porte à runes — le risque vaut la récompense.",
                "reputation_delta": 5,
                "argent_delta": 50,
                "influence_delta": 5,
            },
            {
                "text": "Tu pousses prudemment la porte qui murmure.",
                "reputation_delta": 0,
                "argent_delta": 0,
                "influence_delta": 20,
            },
            {
                "text": "Tu empruntes la porte ordinaire, méfiant du reste.",
                "reputation_delta": 0,
                "argent_delta": 10,
                "influence_delta": 0,
            },
        ],
    },
    {
        "id": "donjon_prisonnier",
        "theme": "donjon",
        "text": (
            "Dans une cellule obscure, un homme enchaîné lève les yeux vers toi. "
            "«\u202fS'il te plaît… libère-moi. Je t'en supplie.\u202f» "
            "Mais sur le mur derrière lui est gravé : «\u202fNe libérez pas le monstre.\u202f»"
        ),
        "choices": [
            {
                "text": "Tu le libères — tout le monde mérite une chance.",
                "reputation_delta": 0,
                "argent_delta": 0,
                "influence_delta": 15,
            },
            {
                "text": "Tu l'interroges en détail avant toute décision.",
                "reputation_delta": 5,
                "argent_delta": 0,
                "influence_delta": 5,
            },
            {
                "text": "Tu passes ton chemin, laissant les runes décider.",
                "reputation_delta": -5,
                "argent_delta": 0,
                "influence_delta": 0,
            },
        ],
    },
    {
        "id": "donjon_trésor_gardé",
        "theme": "donjon",
        "text": (
            "Une salle immense s'ouvre devant toi, son sol jonché d'os. "
            "Au centre, un coffre en or massif — et un dragon endormi, "
            "son souffle lent faisant trembler les flammes des torches."
        ),
        "choices": [
            {
                "text": "Tu voles le trésor avec une extrême précaution.",
                "reputation_delta": 0,
                "argent_delta": 100,
                "influence_delta": 0,
            },
            {
                "text": "Tu recules en silence — mieux vaut vivre pauvre.",
                "reputation_delta": 5,
                "argent_delta": 0,
                "influence_delta": 0,
            },
            {
                "text": "Tu cherches un moyen de tuer le dragon définitivement.",
                "reputation_delta": 20,
                "argent_delta": 80,
                "influence_delta": 30,
            },
        ],
    },
    # ── MARCHÉ ─────────────────────────────────────────────────────────────
    {
        "id": "marche_marchand",
        "theme": "marché",
        "text": (
            "Le marché grouille de monde. Un marchand au sourire trop large te propose "
            "un artefact «\u202fd'une valeur inestimable\u202f» pour seulement 30 pièces. "
            "Son regard fuit légèrement quand il parle."
        ),
        "choices": [
            {
                "text": "Tu achètes — c'est peut-être une affaire en or.",
                "reputation_delta": 0,
                "argent_delta": -30,
                "influence_delta": 5,
            },
            {
                "text": "Tu marchandes férocement et obtiens un prix réduit.",
                "reputation_delta": 0,
                "argent_delta": -15,
                "influence_delta": 5,
            },
            {
                "text": "Tu dénonces l'escroquerie aux autorités du marché.",
                "reputation_delta": 15,
                "argent_delta": 0,
                "influence_delta": 10,
            },
        ],
        "min_argent": 15,
    },
    {
        "id": "marche_voleur",
        "theme": "marché",
        "text": (
            "Tu surprends un gamin en train de subtiliser la bourse d'une vieille dame. "
            "Il te voit, les yeux écarquillés de peur, prêt à fuir. "
            "La dame ne s'est encore rendu compte de rien."
        ),
        "choices": [
            {
                "text": "Tu interpelles l'enfant et restitues la bourse à la dame.",
                "reputation_delta": 20,
                "argent_delta": 0,
                "influence_delta": 10,
            },
            {
                "text": "Tu fais signe à l'enfant de partir discrètement.",
                "reputation_delta": -10,
                "argent_delta": 0,
                "influence_delta": 0,
            },
            {
                "text": "Tu réclames ta part en échange de ton silence.",
                "reputation_delta": -20,
                "argent_delta": 15,
                "influence_delta": -5,
            },
        ],
    },
    {
        "id": "marche_riche",
        "theme": "marché",
        "text": (
            "Avec tes {argent} pièces en poche, tu repères une opportunité rare : "
            "un lot d'épices précieuses à prix cassé — le vendeur a besoin de liquidités vite. "
            "Une revente rapide pourrait doubler ta mise."
        ),
        "min_argent": 80,
        "choices": [
            {
                "text": "Tu investis une grosse partie de tes économies.",
                "reputation_delta": 0,
                "argent_delta": 60,
                "influence_delta": 10,
            },
            {
                "text": "Tu investis prudemment une petite somme.",
                "reputation_delta": 0,
                "argent_delta": 20,
                "influence_delta": 5,
            },
            {
                "text": "Tu passes — l'argent facile cache toujours un piège.",
                "reputation_delta": 5,
                "argent_delta": 0,
                "influence_delta": 0,
            },
        ],
    },
    # ── RENCONTRE ──────────────────────────────────────────────────────────
    {
        "id": "rencontre_voyageur",
        "theme": "rencontre",
        "text": (
            "Sur la route poussiéreuse, tu croises un vieux voyageur au dos courbé. "
            "Il titube, visiblement épuisé. «\u202fJe n'ai pas mangé depuis deux jours, "
            "et ma destination est encore loin,\u202f» murmure-t-il."
        ),
        "choices": [
            {
                "text": "Tu partages ta nourriture et marches un moment avec lui.",
                "reputation_delta": 15,
                "argent_delta": -5,
                "influence_delta": 5,
            },
            {
                "text": "Tu lui donnes des provisions et continues ta route.",
                "reputation_delta": 10,
                "argent_delta": -10,
                "influence_delta": 0,
            },
            {
                "text": "Tu l'ignores — chacun pour soi sur ces routes.",
                "reputation_delta": -10,
                "argent_delta": 0,
                "influence_delta": -5,
            },
        ],
    },
    {
        "id": "rencontre_rival",
        "theme": "rencontre",
        "text": (
            "Un ancien rival — quelqu'un que tu as croisé dans une vie antérieure — "
            "se plante devant toi, les bras croisés. "
            "«\u202fOn m'a dit que tu avais fait fortune. Ça mérite qu'on en parle.\u202f»"
        ),
        "choices": [
            {
                "text": "Tu l'accueilles chaleureusement — les vieilles querelles peuvent mourir.",
                "reputation_delta": 10,
                "argent_delta": 0,
                "influence_delta": 10,
            },
            {
                "text": "Tu restes sur tes gardes et l'écoutes sans t'engager.",
                "reputation_delta": 0,
                "argent_delta": 0,
                "influence_delta": 5,
            },
            {
                "text": "Tu lui tournes le dos — certains ponts méritent de rester brûlés.",
                "reputation_delta": -5,
                "argent_delta": 0,
                "influence_delta": -5,
            },
        ],
    },
    {
        "id": "rencontre_sage",
        "theme": "rencontre",
        "text": (
            "Un vieillard assis sous un arbre te hèle. «\u202fAssieds-toi, {nom}. "
            "Je vois dans ton regard le poids de tes choix.\u202f» Il tend une vieille gourde. "
            "Quelque chose dans ses yeux dit qu'il sait des choses qu'il ne devrait pas savoir."
        ),
        "choices": [
            {
                "text": "Tu acceptes et l'écoutes parler pendant une heure.",
                "reputation_delta": 5,
                "argent_delta": 0,
                "influence_delta": 15,
            },
            {
                "text": "Tu bois avec lui mais gardes tes secrets.",
                "reputation_delta": 0,
                "argent_delta": 0,
                "influence_delta": 5,
            },
            {
                "text": "Tu refuses poliment — les vieillards omniscients te mettent mal à l'aise.",
                "reputation_delta": 0,
                "argent_delta": 0,
                "influence_delta": 0,
            },
        ],
    },
    # ── COMBAT ─────────────────────────────────────────────────────────────
    {
        "id": "combat_duel",
        "theme": "combat",
        "text": (
            "Au milieu de la place publique, un guerrier en armure noire te défie en duel. "
            "«\u202fTa réputation {reputation_text} m'a attiré jusqu'ici, {nom}. "
            "Prouve que tu mérites ce qu'on dit de toi.\u202f» La foule se rassemble."
        ),
        "choices": [
            {
                "text": "Tu acceptes le duel avec honneur.",
                "reputation_delta": 20,
                "argent_delta": 30,
                "influence_delta": 20,
            },
            {
                "text": "Tu proposes une autre épreuve — force d'esprit plutôt que d'épée.",
                "reputation_delta": 10,
                "argent_delta": 0,
                "influence_delta": 15,
            },
            {
                "text": "Tu refuses publiquement — inutile de risquer ta vie pour l'ego.",
                "reputation_delta": -15,
                "argent_delta": 0,
                "influence_delta": -10,
            },
        ],
    },
    {
        "id": "combat_embuscade",
        "theme": "combat",
        "min_rep": -100,
        "max_rep": -20,
        "text": (
            "Ta mauvaise réputation t'a précédé. Dans la nuit, "
            "des assassins te cernent — envoyés par quelqu'un que tu as offensé. "
            "«\u202fLe mandataire envoie ses salutations, {nom}.\u202f»"
        ),
        "choices": [
            {
                "text": "Tu combats avec tout ce que tu as.",
                "reputation_delta": 10,
                "argent_delta": -10,
                "influence_delta": 5,
            },
            {
                "text": "Tu négocie pour découvrir qui t'a envoyé ces tueurs.",
                "reputation_delta": 0,
                "argent_delta": -20,
                "influence_delta": 10,
            },
            {
                "text": "Tu fuis dans l'obscurité, utilisant l'ombre comme alliée.",
                "reputation_delta": -5,
                "argent_delta": 0,
                "influence_delta": -5,
            },
        ],
    },
    # ── MYSTÈRE ────────────────────────────────────────────────────────────
    {
        "id": "mystere_artefact",
        "theme": "mystère",
        "text": (
            "Une boîte noire apparaît sur ta table d'auberge sans que personne ne l'ait déposée. "
            "À l'intérieur : un cristal qui pulse doucement, une lettre sans sceau "
            "et une clé dont la serrure est inconnue."
        ),
        "choices": [
            {
                "text": "Tu touches le cristal pour sentir son pouvoir.",
                "reputation_delta": 0,
                "argent_delta": 0,
                "influence_delta": 20,
            },
            {
                "text": "Tu lis la lettre en priorité.",
                "reputation_delta": 0,
                "argent_delta": 0,
                "influence_delta": 10,
            },
            {
                "text": "Tu apportes la boîte à un mage érudit pour analyse.",
                "reputation_delta": 10,
                "argent_delta": -10,
                "influence_delta": 10,
            },
        ],
    },
    {
        "id": "mystere_vision",
        "theme": "mystère",
        "text": (
            "Cette nuit, un rêve étrange t'envahit : une tour en flammes, "
            "un visage que tu reconnais à moitié, et ta propre voix qui dit "
            "«\u202fCela n'était pas censé se passer ainsi.\u202f» Tu te réveilles en sueur."
        ),
        "choices": [
            {
                "text": "Tu consignes tout par écrit et pars enquêter sur la tour.",
                "reputation_delta": 0,
                "argent_delta": -5,
                "influence_delta": 10,
            },
            {
                "text": "Tu consultes un devin pour interpréter le rêve.",
                "reputation_delta": 0,
                "argent_delta": -15,
                "influence_delta": 15,
            },
            {
                "text": "Tu ignores — les rêves ne sont que des rêves.",
                "reputation_delta": 0,
                "argent_delta": 0,
                "influence_delta": -5,
            },
        ],
    },
    {
        "id": "mystere_disparition",
        "theme": "mystère",
        "text": (
            "Les habitants du village sont en panique : trois enfants ont disparu cette semaine. "
            "Les rumeurs parlent d'une créature des marais. Le maire t'observe, "
            "espérant que quelqu'un comme toi prenne les choses en main."
        ),
        "choices": [
            {
                "text": "Tu enquêtes toi-même sur la disparition.",
                "reputation_delta": 15,
                "argent_delta": 0,
                "influence_delta": 15,
            },
            {
                "text": "Tu organises une milice de villageois pour fouiller les marais.",
                "reputation_delta": 10,
                "argent_delta": 0,
                "influence_delta": 20,
            },
            {
                "text": "Tu proposes tes services, mais exiges une récompense d'abord.",
                "reputation_delta": -5,
                "argent_delta": 40,
                "influence_delta": 5,
            },
        ],
    },
    # ── TRAHISON ───────────────────────────────────────────────────────────
    {
        "id": "trahison_allié",
        "theme": "trahison",
        "text": (
            "Ton meilleur contact en ville t'attend dans un entrepôt vide — "
            "mais en arrivant, tu comprends vite que c'est un piège. "
            "Son regard fuit le tien. «\u202fIls m'ont menacé ma famille, {nom}.\u202f»"
        ),
        "choices": [
            {
                "text": "Tu lui pardonnes et élabores un plan pour le sortir de là.",
                "reputation_delta": 15,
                "argent_delta": -10,
                "influence_delta": 10,
            },
            {
                "text": "Tu t'enfuis — la survie avant la loyauté.",
                "reputation_delta": -5,
                "argent_delta": 0,
                "influence_delta": -10,
            },
            {
                "text": "Tu utilises la situation pour retourner le piège contre ceux qui l'ont tendu.",
                "reputation_delta": 0,
                "argent_delta": 20,
                "influence_delta": 20,
            },
        ],
    },
    {
        "id": "trahison_secret",
        "theme": "trahison",
        "text": (
            "Un inconnu t'aborde et te révèle avoir des informations sur quelqu'un "
            "en qui tu as confiance. Des preuves compromettantes. "
            "Il ne t'en dira pas plus… sauf si tu le rémunères pour sa discrétion."
        ),
        "choices": [
            {
                "text": "Tu paies pour obtenir toute la vérité.",
                "reputation_delta": 0,
                "argent_delta": -25,
                "influence_delta": 10,
            },
            {
                "text": "Tu confrontes directement la personne concernée.",
                "reputation_delta": 10,
                "argent_delta": 0,
                "influence_delta": 5,
            },
            {
                "text": "Tu chasses l'informateur — on ne paie pas les ragots.",
                "reputation_delta": 5,
                "argent_delta": 0,
                "influence_delta": -5,
            },
        ],
    },
    # ── LUXE (argent élevé) ────────────────────────────────────────────────
    {
        "id": "luxe_festin",
        "theme": "ville",
        "min_argent": 150,
        "text": (
            "Avec tes {argent} pièces, tu es invité à un banquet privé chez le Duc. "
            "Des personnages influents s'y trouvent — une soirée qui peut changer "
            "le cours de ta destinée si tu joues bien tes cartes."
        ),
        "choices": [
            {
                "text": "Tu réseautes activement toute la soirée.",
                "reputation_delta": 10,
                "argent_delta": -20,
                "influence_delta": 30,
            },
            {
                "text": "Tu observes discrètement, collectant des informations précieuses.",
                "reputation_delta": 0,
                "argent_delta": 0,
                "influence_delta": 20,
            },
            {
                "text": "Tu profites du festin sans agenda caché.",
                "reputation_delta": 5,
                "argent_delta": -10,
                "influence_delta": 10,
            },
        ],
    },
    # ── CLASSE SPÉCIFIQUE ──────────────────────────────────────────────────
    {
        "id": "classe_voleur_heist",
        "theme": "trahison",
        "classes": ["voleur"],
        "text": (
            "Ton instinct de {classe_text} s'éveille devant la maison du percepteur. "
            "Ses volets fermés, sa garde absente ce soir — "
            "une opportunité que le destin ne t'offre qu'une fois."
        ),
        "choices": [
            {
                "text": "Tu pénètres dans la demeure avec toute ta discrétion.",
                "reputation_delta": -15,
                "argent_delta": 80,
                "influence_delta": 5,
            },
            {
                "text": "Tu passes la nuit à surveiller, cherchant une meilleure approche.",
                "reputation_delta": 0,
                "argent_delta": 0,
                "influence_delta": 10,
            },
            {
                "text": "Tu renonces — voler est une voie sans issue.",
                "reputation_delta": 15,
                "argent_delta": 0,
                "influence_delta": 0,
            },
        ],
    },
    {
        "id": "classe_marchand_négociation",
        "theme": "marché",
        "classes": ["marchand"],
        "text": (
            "En tant que {classe_text} réputé, une guilde commerciale te contacte. "
            "Ils veulent un associé de confiance pour une route commerciale "
            "potentiellement très lucrative — mais risquée politiquement."
        ),
        "choices": [
            {
                "text": "Tu rejoins la guilde et prends une part active.",
                "reputation_delta": 5,
                "argent_delta": 50,
                "influence_delta": 20,
            },
            {
                "text": "Tu négocies des conditions plus favorables avant d'accepter.",
                "reputation_delta": 0,
                "argent_delta": 30,
                "influence_delta": 15,
            },
            {
                "text": "Tu déclines respectueusement — tu travailles seul.",
                "reputation_delta": 5,
                "argent_delta": 0,
                "influence_delta": -5,
            },
        ],
    },
    {
        "id": "classe_aventurier_quête",
        "theme": "forêt",
        "classes": ["aventurier"],
        "text": (
            "Un parchemin scellé te parvient : une ancienne guilde d'aventuriers "
            "a repéré une ruine inexplorée à deux jours de marche. "
            "On t'invite à mener l'expédition en tant que {classe_text} de renom."
        ),
        "choices": [
            {
                "text": "Tu acceptes et prends la tête de l'expédition.",
                "reputation_delta": 10,
                "argent_delta": 0,
                "influence_delta": 20,
            },
            {
                "text": "Tu participes mais partages le commandement.",
                "reputation_delta": 5,
                "argent_delta": 20,
                "influence_delta": 10,
            },
            {
                "text": "Tu vends l'information à un autre groupe.",
                "reputation_delta": -10,
                "argent_delta": 30,
                "influence_delta": -5,
            },
        ],
    },
    # ── RÉPUTATION ÉLEVÉE ──────────────────────────────────────────────────
    {
        "id": "réputation_héros",
        "theme": "rencontre",
        "min_rep": 50,
        "text": (
            "Des enfants courent vers toi en criant ton nom avec admiration. "
            "Un scribe les suit de près. «\u202fPuis-je écrire ta biographie, {nom} ? "
            "Tes exploits méritent d'être immortalisés.\u202f»"
        ),
        "choices": [
            {
                "text": "Tu acceptes avec humilité — que l'histoire retienne les leçons.",
                "reputation_delta": 10,
                "argent_delta": 20,
                "influence_delta": 20,
            },
            {
                "text": "Tu acceptes mais exiges de relire chaque chapitre.",
                "reputation_delta": 5,
                "argent_delta": 30,
                "influence_delta": 15,
            },
            {
                "text": "Tu refuses — l'anonymat est une armure.",
                "reputation_delta": 0,
                "argent_delta": 0,
                "influence_delta": -10,
            },
        ],
    },
    {
        "id": "réputation_infâme",
        "theme": "rencontre",
        "max_rep": -30,
        "text": (
            "Les habitants ferment leurs volets sur ton passage. Une vieille femme crache devant toi. "
            "«\u202fMaudite soit la journée où tu es venu dans notre ville, {nom}.\u202f» "
            "Ta réputation {reputation_text} t'a précédé — et ce n'est pas un avantage."
        ),
        "choices": [
            {
                "text": "Tu fais un geste public pour regagner leur confiance.",
                "reputation_delta": 20,
                "argent_delta": -20,
                "influence_delta": 5,
            },
            {
                "text": "Tu embrasses ta réputation — la peur est aussi un pouvoir.",
                "reputation_delta": -10,
                "argent_delta": 0,
                "influence_delta": 10,
            },
            {
                "text": "Tu changes d'apparence et de nom temporairement.",
                "reputation_delta": 5,
                "argent_delta": -10,
                "influence_delta": -5,
            },
        ],
    },
]
