import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Lang } from "@/constants";

const DICT = {
  ar: {
    appName: "دبرلي",
    tagline: "سوق العقارات الجزائري — عرض وطلب في مكان واحد",
    supply: "العرض",
    demand: "الطلب",
    home: "الرئيسية",
    messages: "الرسائل",
    postAd: "أضف إعلان",
    account: "حسابي",
    signIn: "تسجيل الدخول",
    signOut: "تسجيل الخروج",
    wilaya: "الولاية",
    baladiya: "البلدية",
    propertyType: "نوع العقار",
    transactionType: "نوع المعاملة",
    all: "الكل",
    search: "بحث بالكلمات المفتاحية",
    filters: "عوامل التصفية",
    reset: "إعادة تعيين",
    results: "نتيجة",
    noResults: "لا توجد إعلانات مطابقة",
    price: "السعر",
    advance: "التسبيق",
    negotiable: "السعر عند الاتصال",
    call: "اتصال",
    whatsapp: "واتساب",
    message: "مراسلة",
    premiumOnly: "رقم الهاتف متاح لأصحاب الحسابات المميزة والوكالات",
    description: "الوصف",
    address: "العنوان",
    postedBy: "نشر بواسطة",
    next: "التالي",
    back: "رجوع",
    publish: "نشر الإعلان",
    step: "الخطوة",
    conversations: "المحادثات",
    noConversations: "لا توجد محادثات بعد",
    typeMessage: "اكتب رسالتك...",
    send: "إرسال",
    myAds: "إعلاناتي",
    agency: "وكالة",
    dzd: "دج",
  },
  fr: {
    appName: "FindMeDZ",
    tagline: "Le marché immobilier algérien — offres et demandes réunies",
    supply: "Offres",
    demand: "Demandes",
    home: "Accueil",
    messages: "Messages",
    postAd: "Publier",
    account: "Compte",
    signIn: "Se connecter",
    signOut: "Déconnexion",
    wilaya: "Wilaya",
    baladiya: "Baladiya",
    propertyType: "Type de bien",
    transactionType: "Transaction",
    all: "Tous",
    search: "Rechercher par mots-clés",
    filters: "Filtres",
    reset: "Réinitialiser",
    results: "résultat(s)",
    noResults: "Aucune annonce correspondante",
    price: "Prix",
    advance: "Avance",
    negotiable: "Prix sur demande",
    call: "Appeler",
    whatsapp: "WhatsApp",
    message: "Message",
    premiumOnly: "Numéro visible pour les comptes Premium et les agences",
    description: "Description",
    address: "Adresse",
    postedBy: "Publié par",
    next: "Suivant",
    back: "Retour",
    publish: "Publier l'annonce",
    step: "Étape",
    conversations: "Conversations",
    noConversations: "Aucune conversation",
    typeMessage: "Écrivez votre message...",
    send: "Envoyer",
    myAds: "Mes annonces",
    agency: "Agence",
    dzd: "DA",
  },
} as const;

export type DictKey = keyof (typeof DICT)["ar"];

interface LangCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: DictKey) => string;
  dir: "rtl" | "ltr";
}

const Ctx = createContext<LangCtx | null>(null);

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>("ar");

  useEffect(() => {
    const stored = window.localStorage.getItem("findmedz-lang") as Lang | null;
    if (stored === "ar" || stored === "fr") setLang(stored);
  }, []);

  useEffect(() => {
    window.localStorage.setItem("findmedz-lang", lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  }, [lang]);

  const value = useMemo<LangCtx>(
    () => ({
      lang,
      setLang,
      dir: lang === "ar" ? "rtl" : "ltr",
      t: (key) => DICT[lang === "ar" ? "ar" : "fr"][key],
    }),
    [lang],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useLang() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useLang must be used inside LangProvider");
  return ctx;
}