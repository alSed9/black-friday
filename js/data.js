/* ============================================================
   BlaFR — Données de configuration et catalogue
   Expose : BlaFR.CONFIG, BlaFR.CATEGORIES, BlaFR.PRODUCTS, BlaFR.getProduct
   ============================================================ */
(function () {
  'use strict';
  const NS = (window.BlaFR = window.BlaFR || {});

  /* ============================================================
     CONFIG globale
     ============================================================ */
  NS.CONFIG = {
    /* Date fixe de fin de la vente */
    saleEnd: "2026-11-30T23:59:59",

    /* Seuil de livraison offerte et frais de port */
    freeShippingThreshold: 100,
    shippingFee: 4.90,

    /* Codes promo (taux de remise, ex. 0.10 = -10%) */
    promoCodes: {
      BLACK10: 0.10,
      MERCI10: 0.10
    }
  };

  /* ============================================================
     Catégories
     ============================================================ */
  NS.CATEGORIES = {
    salon:      "Salon",
    chambre:    "Chambre",
    cuisine:    "Cuisine & table",
    decoration: "Décoration",
    eclairage:  "Éclairage"
  };

  /* ============================================================
     Catalogue produits (12 produits, 4 en flash)
     ============================================================ */
  NS.PRODUCTS = [
    {
      id: 1,
      name: "Lampadaire arc en laiton",
      category: "eclairage",
      price: 89, oldPrice: 179,
      rating: 4.9, reviews: 128,
      stock: 7, stockInitial: 40,
      badge: "flash", flash: true,
      image: "assets/img/product-01.jpg",
      description: "Structure en laiton brossé et base en marbre blanc véritable. Arc réglable en hauteur, éclairage d'ambiance chaleureux."
    },
    {
      id: 2,
      name: "Canapé 3 places en velours",
      category: "salon",
      price: 449, oldPrice: 899,
      rating: 4.9, reviews: 88,
      stock: 12, stockInitial: 30,
      badge: null, flash: false,
      image: "assets/img/product-02.jpg",
      description: "Velours italien haute densité et antitache, piétement en chêne massif noirci. Assise moelleuse et durable."
    },
    {
      id: 3,
      name: "Parure de lit en lin 240x220",
      category: "chambre",
      price: 59, oldPrice: 129,
      rating: 4.8, reviews: 64,
      stock: 25, stockInitial: 80,
      badge: "bestseller", flash: false,
      image: "assets/img/product-03.jpg",
      description: "100% lin lavé de Normandie, respirant et thermorégulateur. Douceur immédiate, sans repassage."
    },
    {
      id: 4,
      name: "Vase en céramique artisanal",
      category: "decoration",
      price: 24, oldPrice: 49,
      rating: 4.7, reviews: 18,
      stock: 30, stockInitial: 60,
      badge: null, flash: true,
      image: "assets/img/product-04.jpg",
      description: "Terre cuite chamottée, texture rugueuse façonnée à la main. Pièce unique aux reflets mats."
    },
    {
      id: 5,
      name: "Miroir rond doré 80 cm",
      category: "decoration",
      price: 69, oldPrice: 139,
      rating: 4.9, reviews: 32,
      stock: 15, stockInitial: 40,
      badge: null, flash: false,
      image: "assets/img/product-05.jpg",
      description: "Cadre fin en laiton brossé anodisé, verre optique haute définition. Fixation murale invisible incluse."
    },
    {
      id: 6,
      name: "Table basse en chêne",
      category: "salon",
      price: 129, oldPrice: 259,
      rating: 4.8, reviews: 51,
      stock: 9, stockInitial: 30,
      badge: null, flash: false,
      image: "assets/img/product-06.jpg",
      description: "Chêne massif certifié FSC, vernis mat protecteur bio-sourcé. Assemblages traditionnels à tenons et mortaises."
    },
    {
      id: 7,
      name: "Plaid en laine bouclée",
      category: "chambre",
      price: 34, oldPrice: 79,
      rating: 4.9, reviews: 53,
      stock: 20, stockInitial: 60,
      badge: "new", flash: true,
      image: "assets/img/product-07.jpg",
      description: "Laine mérinos ultra-moelleuse 130x170 cm, finition frangée main. Chaleur naturelle et légèreté."
    },
    {
      id: 8,
      name: "Suspension en rotin",
      category: "eclairage",
      price: 49, oldPrice: 119,
      rating: 4.8, reviews: 29,
      stock: 4, stockInitial: 45,
      badge: "flash", flash: true,
      image: "assets/img/product-08.jpg",
      description: "Rotin tressé à la main, doublure coton diffusante. Lumière tamisée et chaleureuse pour toute la pièce."
    },
    {
      id: 9,
      name: "Set de 6 verres à pied",
      category: "cuisine",
      price: 29, oldPrice: 59,
      rating: 4.6, reviews: 22,
      stock: 40, stockInitial: 100,
      badge: null, flash: false,
      image: "assets/img/product-09.jpg",
      description: "Cristallin soufflé bouche, silhouette élancée et fond nervuré. Passe au lave-vaisselle."
    },
    {
      id: 10,
      name: "Tapis berbère 160x230",
      category: "salon",
      price: 149, oldPrice: 349,
      rating: 4.9, reviews: 73,
      stock: 11, stockInitial: 35,
      badge: null, flash: false,
      image: "assets/img/product-10.jpg",
      description: "Laine naturelle tissée main, motifs géométriques traditionnels. Chaque pièce est unique."
    },
    {
      id: 11,
      name: "Lot de 3 bougies parfumées",
      category: "decoration",
      price: 19, oldPrice: 45,
      rating: 4.7, reviews: 39,
      stock: 60, stockInitial: 150,
      badge: null, flash: false,
      image: "assets/img/product-11.jpg",
      description: "Cire de soja bio, mèches en bois crépitantes. Notes de cèdre, ambre et vanille bourbon."
    },
    {
      id: 12,
      name: "Étagère murale flottante",
      category: "decoration",
      price: 39, oldPrice: 89,
      rating: 4.8, reviews: 45,
      stock: 18, stockInitial: 50,
      badge: null, flash: false,
      image: "assets/img/product-12.jpg",
      description: "Fixation invisible renforcée 25 kg, plaqué chêne fumé satiné. Installation en 10 minutes."
    }
  ];

  /* ============================================================
     Helper : récupérer un produit par id
     ============================================================ */
  NS.getProduct = function (id) {
    const n = Number(id);
    return NS.PRODUCTS.find(p => p.id === n) || null;
  };
})();