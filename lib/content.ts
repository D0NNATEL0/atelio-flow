export const dashboardMetrics = [
  {
    label: "Devis en cours",
    value: "14",
    subtext: "3 devis attendent une réponse cette semaine."
  },
  {
    label: "Factures payées",
    value: "8 420 €",
    subtext: "Un aperçu simple des encaissements du mois."
  },
  {
    label: "Clients actifs",
    value: "38",
    subtext: "Retrouvez rapidement toutes les fiches client."
  },
  {
    label: "Relances prévues",
    value: "5",
    subtext: "Des rappels actionnables pour ne rien laisser passer."
  }
] as const;

export const features = [
  {
    icon: "01",
    title: "Clients centralisés",
    description:
      "Chaque professionnel gère ses fiches client, coordonnées et historique depuis un seul espace."
  },
  {
    icon: "02",
    title: "Devis rapides",
    description:
      "Créez un devis propre en quelques secondes, envoyez-le puis suivez son statut sans friction."
  },
  {
    icon: "03",
    title: "Factures fluides",
    description:
      "Transformez un devis accepté en facture et gardez une trace claire des paiements."
  },
  {
    icon: "04",
    title: "Relances utiles",
    description:
      "Relancez les devis en attente et les factures impayées au bon moment avec un ton professionnel."
  },
  {
    icon: "05",
    title: "Auth moderne",
    description:
      "Connexion par email, Google et Apple pour une prise en main simple sur web et mobile."
  },
  {
    icon: "06",
    title: "Freemium clair",
    description:
      "Une version gratuite déjà utile, puis un abonnement premium pour les usages avancés."
  }
] as const;

export const workflowSteps = [
  {
    step: "Étape 1",
    title: "Ajouter un client",
    description:
      "Le professionnel crée sa fiche client avec ses informations essentielles."
  },
  {
    step: "Étape 2",
    title: "Envoyer un devis",
    description:
      "Le devis est créé, personnalisé puis partagé en quelques clics."
  },
  {
    step: "Étape 3",
    title: "Convertir en facture",
    description:
      "Une fois accepté, le devis devient facture sans ressaisie manuelle."
  },
  {
    step: "Étape 4",
    title: "Suivre et relancer",
    description:
      "Atelio aide à suivre les statuts et déclenche les relances au bon moment."
  }
] as const;

export const plans = [
  {
    name: "Free",
    price: "0 €",
    period: "pour démarrer",
    tag: "Essentiel",
    features: [
      "Clients et documents en volume limité",
      "Création de devis et factures",
      "Export PDF simple",
      "Relances manuelles"
    ]
  },
  {
    name: "Premium",
    price: "19 €",
    period: "par mois",
    tag: "Recommandé",
    featured: true,
    features: [
      "Clients, devis et factures illimités",
      "Relances automatiques",
      "Personnalisation avancée",
      "Stats, export et priorité support"
    ]
  }
] as const;

export const clientsTable = [
  {
    client: "Studio Noma",
    contact: "Léa Martin",
    email: "lea@studiodoma.fr",
    status: "Actif",
    total: "3 240 €"
  },
  {
    client: "Atelier Bloom",
    contact: "Sami Boulanger",
    email: "contact@atelierbloom.com",
    status: "À relancer",
    total: "1 180 €"
  },
  {
    client: "Maison Aster",
    contact: "Julie Pons",
    email: "bonjour@maisonaster.fr",
    status: "Nouveau",
    total: "420 €"
  }
] as const;

export const quotesTable = [
  {
    id: "DV-2026-014",
    client: "Studio Noma",
    amount: "1 200 €",
    status: "En attente",
    due: "Dans 2 jours"
  },
  {
    id: "DV-2026-015",
    client: "Maison Aster",
    amount: "640 €",
    status: "Accepté",
    due: "Prêt à convertir"
  },
  {
    id: "DV-2026-016",
    client: "Atelier Bloom",
    amount: "920 €",
    status: "Envoyé",
    due: "Aujourd’hui"
  }
] as const;

export const invoicesTable = [
  {
    id: "FA-2026-038",
    client: "Studio Noma",
    amount: "1 200 €",
    status: "Payée",
    due: "28 mars 2026"
  },
  {
    id: "FA-2026-039",
    client: "Atelier Bloom",
    amount: "920 €",
    status: "En retard",
    due: "24 mars 2026"
  },
  {
    id: "FA-2026-040",
    client: "Maison Aster",
    amount: "640 €",
    status: "Envoyée",
    due: "5 avril 2026"
  }
] as const;

export const remindersTable = [
  {
    target: "DV-2026-014",
    client: "Studio Noma",
    type: "Devis en attente",
    when: "Relance demain",
    channel: "Email"
  },
  {
    target: "FA-2026-039",
    client: "Atelier Bloom",
    type: "Facture impayée",
    when: "En retard de 4 jours",
    channel: "Email + notification"
  },
  {
    target: "FA-2026-040",
    client: "Maison Aster",
    type: "Rappel avant échéance",
    when: "Dans 3 jours",
    channel: "Notification"
  }
] as const;

export const appInsights = [
  {
    title: "Chiffre du mois",
    value: "8 420 €",
    description: "Le total encaissé ce mois-ci, visible en un coup d’œil."
  },
  {
    title: "Conversion devis",
    value: "68 %",
    description: "Une mesure simple pour suivre ce qui se transforme en facture."
  },
  {
    title: "Clients actifs",
    value: "38",
    description: "Les clients les plus engagés dans votre cycle commercial."
  }
] as const;

export const accountMetrics = [
  {
    title: "Plan actuel",
    value: "Free",
    description: "Passez en Premium pour débloquer les relances automatiques."
  },
  {
    title: "Langue",
    value: "Français",
    description: "Le français est utilisé comme langue par défaut dans l'app."
  },
  {
    title: "Documents créés",
    value: "22",
    description: "Un aperçu rapide des devis et factures déjà créés."
  }
] as const;

export const accountProfile = {
  fullName: "Mathis Dupont",
  companyName: "Atelio Studio",
  activityLabel: "Photographe indépendant",
  professionalEmail: "contact@atelio.app",
  phone: "+33 6 12 34 56 78",
  defaultLanguage: "Français",
  billingEmail: "contact@atelio.app",
  city: "Paris",
  country: "France",
  plan: "Free",
  memberSince: "Mars 2026"
} as const;

export const dashboardPeriods = [
  { id: "day", label: "Jour" },
  { id: "week", label: "Semaine" },
  { id: "month", label: "Mois" },
  { id: "year", label: "Année" }
] as const;

export const appInsightsByPeriod = {
  day: [
    {
      title: "Chiffre du jour",
      value: "620 €",
      description: "Le revenu encaissé aujourd’hui sur les factures réglées."
    },
    {
      title: "Devis du jour",
      value: "3",
      description: "Les propositions envoyées ou relancées dans la journée."
    },
    {
      title: "Actions prioritaires",
      value: "2",
      description: "Les dossiers commerciaux les plus urgents à traiter aujourd’hui."
    }
  ],
  week: [
    {
      title: "Chiffre semaine",
      value: "2 480 €",
      description: "Les encaissements visibles sur les 7 derniers jours."
    },
    {
      title: "Conversion devis",
      value: "54 %",
      description: "Le ratio des devis signés cette semaine."
    },
    {
      title: "Devis en attente",
      value: "4",
      description: "Les propositions qui demandent encore une réponse cette semaine."
    }
  ],
  month: [
    {
      title: "Chiffre du mois",
      value: "8 420 €",
      description: "Le total encaissé ce mois-ci, visible en un coup d’œil."
    },
    {
      title: "Conversion devis",
      value: "68 %",
      description: "Une mesure simple pour suivre ce qui se transforme en facture."
    },
    {
      title: "Clients actifs",
      value: "38",
      description: "Le nombre de clients suivis activement ce mois-ci."
    }
  ],
  year: [
    {
      title: "Chiffre annuel",
      value: "74 800 €",
      description: "La vue macro sur la performance commerciale de l’année."
    },
    {
      title: "Devis signés",
      value: "126",
      description: "Le volume de devis transformés en ventes cette année."
    },
    {
      title: "Clients actifs",
      value: "38",
      description: "Le nombre de clients suivis activement sur la période."
    }
  ]
} as const;

export const clientsSummary = [
  {
    title: "Clients actifs",
    value: "38",
    description: "Les relations commerciales suivies cette période."
  },
  {
    title: "À relancer",
    value: "6",
    description: "Les clients qui demandent une reprise de contact rapide."
  },
  {
    title: "Valeur client",
    value: "12 840 €",
    description: "Le chiffre d’affaires cumulé généré par les clients affichés."
  }
] as const;

export const quotesSummary = [
  {
    title: "Devis en cours",
    value: "14",
    description: "Les devis actuellement en attente d’une réponse."
  },
  {
    title: "Acceptés",
    value: "9",
    description: "Les devis validés et prêts à être convertis en facture."
  },
  {
    title: "Montant estimé",
    value: "18 200 €",
    description: "La valeur totale des devis suivis ce mois-ci."
  }
] as const;

export const invoicesSummary = [
  {
    title: "À encaisser",
    value: "3 560 €",
    description: "Le montant restant à encaisser sur les factures ouvertes."
  },
  {
    title: "Payées",
    value: "22",
    description: "Les factures réglées sur la période sélectionnée."
  },
  {
    title: "Retards",
    value: "2",
    description: "Les factures qui nécessitent une action rapide."
  }
] as const;

export const remindersSummary = [
  {
    title: "Relances prévues",
    value: "5",
    description: "Les relances programmées dans les prochains jours."
  },
  {
    title: "Urgentes",
    value: "2",
    description: "Les dossiers à traiter aujourd’hui pour ne rien laisser filer."
  },
  {
    title: "Automatisées",
    value: "3",
    description: "Les relances préparées pour partir sans intervention manuelle."
  }
] as const;

export const revenueMonthPoints = [
  { day: "1", amount: 120 },
  { day: "3", amount: 260 },
  { day: "5", amount: 180 },
  { day: "7", amount: 540 },
  { day: "10", amount: 420 },
  { day: "12", amount: 860 },
  { day: "15", amount: 630 },
  { day: "18", amount: 980 },
  { day: "21", amount: 720 },
  { day: "24", amount: 1240 },
  { day: "27", amount: 980 },
  { day: "30", amount: 1500 }
] as const;
