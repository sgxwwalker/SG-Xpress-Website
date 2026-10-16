import { PRIVACY_LAST_UPDATED, PRIVACY_MD } from "@/content/privacy";
import { TERMS_MD } from "@/content/terms";
import { btn, img, LOGIN, page, REGISTER, wa } from "@/lib/blocks/fields";
import { makeSections } from "./page-factory";
import type { Page } from "./pages-schema";

// The starting content of every built-in page, matching the site as designed.
// Staff change all of it in /admin → Pages; this is only used until they save.

function builtin(id: string, name: string, seoTitle: string, seoDescription: string, list: Parameters<typeof makeSections>[1]): Page {
  return { id, slug: id === "home" ? "" : id, name, seoTitle, seoDescription, published: true, showInFooter: false, sections: makeSections(id, list) };
}

const AIR_IMG = img("/images/air-freight.jpg", "We offer 3 times per week air shipping, 48 to 72 hours", 760, 760);
const SEA_IMG = img("/images/sea-freight.jpg", "Ship for less by sea freight: weightless shipping, commercial rate available", 760, 760);
const CHINA_IMG = img("/images/china-direct.jpg", "China Direct shipping: we ship every 3 weeks from China", 760, 706);
const SIGN_UP = btn("Sign up free", REGISTER, "gold");
const SIGN_UP_CTA_TEXT = "Free to join. Your US address is ready right after sign-up.";
const CHINA_HELLO = "Hi SG Xpress, I'd like to ship from China";

const card = (p: Record<string, unknown>) => ({ showIcon: true, ...p });

export function defaultPages(): Page[] {
  return [
    builtin("home", "Home", "Courier & Shipping to Jamaica from USA & China", "Free US address, air from the USA three times a week, ocean freight, China Direct and barrels. Pick up at our branches or get islandwide delivery.", [
      ["hero", {
        style: "large",
        heading: "Ship from the USA and China to Jamaica",
        text: "Get a free US address, shop any store, and collect at a branch or get it delivered islandwide.",
        buttons: [btn("Sign up free", REGISTER, "gold", "arrow"), btn("Customer login", LOGIN, "outline-light"), btn("View rates", page("/rates"), "outline-light")],
        checks: [{ text: "No sign-up fee" }, { text: "No credit card needed" }, { text: "USA air 3× weekly" }],
        image: AIR_IMG,
        hideImageOnPhone: true,
      }],
      ["steps", {
        heading: "Four steps to your door",
        items: [
          { title: "Register free", text: "Sign up online or in the app. Takes about two minutes." },
          { title: "Get your US address", text: "Open My Address. Your SGX number goes on Address Line 2." },
          { title: "Shop and ship", text: "Buy from any US store. Upload your invoice when we receive it." },
          { title: "Track and collect", text: "Follow it in the app. Pick up within {storage free days} days of your ready notice; storage charges begin on day {storage charge day}." },
        ],
        buttons: [btn("Get my free US address", REGISTER)],
      }],
      ["cards", {
        heading: "Pick how you ship",
        items: [
          card({ image: AIR_IMG, icon: "plane", title: "USA Air", meta: "Flights {flight days} · {air transit}", text: "Best for clothes, electronics, small and urgent items. Priced per pound.", buttons: [btn("See air rates", page("/rates#air"))] }),
          card({ image: SEA_IMG, icon: "ship", title: "USA Ocean", meta: "Weekly sailings · {ocean transit}", text: "Best for furniture, appliances and bulky items. Priced per cubic foot, not weight. Commercial rates available, conditions apply.", buttons: [btn("See ocean rates", page("/rates#ocean"))] }),
          card({ image: CHINA_IMG, icon: "globe", dark: true, title: "China Direct", meta: "Air {china air transit} · Sea ships weekly", text: "Air for small, light items. Sea for heavy or bulky orders. Message us before you ship: unconfirmed packages can't be sent.", buttons: [btn("WhatsApp us", wa("whatsapp-china", CHINA_HELLO), "gold"), btn("How it works", page("/china-direct"), "outline-light")] }),
          card({ icon: "barrel", title: "Barrel Shipping", meta: "From Florida · Quote", text: "Best for groceries, household goods and gifts. We ship and clear customs for you.", buttons: [btn("Get a barrel quote", wa("whatsapp-quotes", "Hi SG Xpress, I'd like a barrel quote"))] }),
          card({ icon: "cart", title: "Order Services", meta: "No credit card? We buy for you", text: "Send us the item link and we place the order with our card. Our team will quote the fee.", buttons: [btn("Request an order", wa("whatsapp-quotes", "Hi SG Xpress, I'd like you to order an item for me"))] }),
          card({ icon: "doc", title: "Customs Brokerage", meta: "Personal or commercial · Quote", text: "Let us handle Customs clearance for you. We help with the documents, submission and processing, and coordinate clearance with Jamaica Customs.", buttons: [btn("Get a quote & document list", wa("whatsapp-quotes", "Hi SG Xpress, I'd like a customs brokerage quote"))] }),
        ],
      }, { anchor: "services", tone: "mist" }],
      ["imageText", {
        heading: "Track every package in the SGX app",
        text: "Track packages, check rates, pay, schedule pickups and manage your account.",
        appBadges: true,
        image: img("/images/try-the-app.jpg", "Try out the SG Xpress app: track your packages, check rates, pay for packages, schedule pickups and manage your account", 706, 900),
      }, { tone: "gold" }],
      ["branchCards", { heading: "Two branches in Montego Bay" }, { anchor: "locations" }],
      ["faq", { heading: "Quick answers", source: "featured", limit: 6, moreLink: page("/faqs"), moreLabel: "All FAQs & restricted items" }],
      ["cta", { heading: "Ready to shop the USA and China?", text: SIGN_UP_CTA_TEXT, buttons: [SIGN_UP], footnote: "Popular stores: Amazon · Shein · Walmart · eBay · Temu · Best Buy" }],
    ]),

    builtin("rates", "Rates", "Air & Ocean Shipping Rates to Jamaica", "USA Air rates by weight, processing fees, USA Ocean, China Direct and barrel shipping prices in Jamaican dollars.", [
      ["hero", { heading: "Shipping rates", buttons: [btn("Estimate your cost →", page("/calculator"), "gold")] }],
      ["jumpLinks", { items: [
        { label: "USA Air", anchor: "air" }, { label: "Fees", anchor: "fees" }, { label: "USA Ocean", anchor: "ocean" }, { label: "China", anchor: "china" }, { label: "Barrels", anchor: "barrels" },
      ] }],
      ["airRates", { heading: "Air freight by weight", text: "{air transit}, flights {flight days}. Freight only; fees are below." }, { anchor: "air", tone: "mist" }],
      ["feesTables", {
        heading: "On top of freight",
        processingCaption: "Processing fee (per package)",
        underLabel: "Under 10 lb",
        overLabel: "10 lb and over",
        otherCaption: "Other charges",
        lateLabel: "Late invoice (after clearance day)",
        storageLabel: "Storage ({storage free days} calendar days free; charges begin on day {storage charge day})",
        note: "Packages not collected within {auction days} days are auctioned to cover costs.",
      }, { anchor: "fees" }],
      ["oceanRates", {
        heading: "Weightless sea freight",
        text: "Weekly sailings, {ocean transit}. Priced by size, not weight.",
        cuftLabel: "Per cubic foot",
        smallLabel: "Under {ocean small limit} cubic foot",
        after: "**Commercial rates available** for businesses and large volumes. Conditions apply.",
        buttons: [btn("Ask about commercial rates", wa("whatsapp-general", "Hi SG Xpress, I'd like an ocean freight quote"))],
      }, { anchor: "ocean" }],
      ["chinaRates", {
        heading: "Shipping from China",
        airExtra: "No processing fee",
        seaExtra: "Ships weekly",
        note: "Message us before you order. Unconfirmed China packages are not shipped.",
        buttons: [btn("China Direct addresses & steps →", page("/china-direct"), "outline")],
        image: img("/images/china-stores-2026-10.jpg", "Ship directly from China: 1688, Taobao, Alibaba and AliExpress, by air freight or sea freight. Reliable shipping to Jamaica.", 760, 760),
        imageLink: wa("whatsapp-china", "Hi SG Xpress, I'd like help with a China order"),
      }, { anchor: "china" }],
      ["banner", {
        style: "white",
        heading: "Barrels",
        text: "Shipped and cleared from Florida. Prices depend on barrel size.",
        buttons: [btn("Get a barrel quote", wa("whatsapp-quotes", "Hi SG Xpress, I'd like a barrel quote"))],
      }, { anchor: "barrels", tone: "mist" }],
      ["cta", { heading: "Start shipping today", text: SIGN_UP_CTA_TEXT, buttons: [SIGN_UP], footnote: "Rates may change without notice. Questions? [Read the FAQs](/faqs)." }],
    ]),

    builtin("calculator", "Calculator", "Shipping Cost Calculator, USA to Jamaica", "Know the cost before you ship. Estimate USA Air or Ocean shipping to Jamaica, with shipping, fees and service charge shown separately.", [
      ["hero", { eyebrow: "Shipping cost calculator", heading: "Know the cost before you ship.", text: "Enter a weight or a volume and we'll break it down for you: shipping, fees and service charge." }],
      ["calculator", {
        buttons: [btn("Sign up free", REGISTER, "gold"), btn("Full rate sheet", page("/rates"), "outline")],
        footnote: "Shipping something bigger, a barrel or from China? [Ask us for a quote](/contact).",
      }],
    ]),

    builtin("china-direct", "China Direct", "Ship from China to Jamaica, China Direct", "Ship from China to Jamaica by air or sea, including dangerous goods. Our China warehouse addresses and how it works.", [
      ["hero", {
        heading: "China Direct",
        text: "Buy from suppliers in China and ship straight to Jamaica by air or sea, including dangerous goods.",
        buttons: [btn("Ask on WhatsApp first", wa("whatsapp-china", CHINA_HELLO), "gold", "chat"), btn("See how it works", page("#steps"), "outline-light")],
        image: CHINA_IMG,
      }],
      ["note", { title: "Message us before you order", text: "Every China shipment must be confirmed by our team on WhatsApp. Packages sent without confirmation will not be shipped." }],
      ["chinaOptions", {
        heading: "Air or sea?",
        airTitle: "China Air",
        airNote: "No processing fee.",
        airBest: "Small, light items",
        airAvoid: "Heavy or bulky goods: choose sea",
        seaTitle: "China Sea",
        seaPrice: "Quote on request",
        seaNote: "Ships weekly. Sea rates change often, so we quote each shipment.",
        seaBest: "Heavy, bulky or expensive items: furniture, machines, stock for your business",
        seaButtons: [btn("Get a sea quote", wa("whatsapp-china", "Hi SG Xpress, I'd like a China sea freight quote"))],
        dgHeading: "Dangerous goods",
        dgText: "Items that contain any of these must go to our dangerous goods address, with its own entrance number. Ask us before you buy.",
        dgItems: [{ text: "Batteries" }, { text: "Liquids" }, { text: "Powders" }],
        dgLink: page("#address"),
        dgLinkLabel: "Dangerous goods address",
      }, { anchor: "options" }],
      ["steps", {
        heading: "Four steps from China",
        items: [
          { title: "Message us on WhatsApp", text: "Send the item link or your supplier details before you pay." },
          { title: "We confirm the method", text: "Air, sea or dangerous goods. We check the item and give you the go-ahead." },
          { title: "Ship to the matching address", text: "Give your supplier the address and label below, with SGX and your full name as the mark." },
          { title: "Collect or get it delivered", text: "We message you when it's ready. Pick it up at a branch or get it delivered anywhere in Jamaica." },
        ],
      }, { anchor: "steps", tone: "mist" }],
      ["chinaAddresses", {
        heading: "Our China addresses",
        intro: "Use the address that matches what we confirmed. Put SGX and your full name on every package.",
        airImage: img("/images/label-air-2026-10.jpg", "China Air Warehouse shipping label template", 760, 760),
        seaImage: img("/images/label-sea-2026-10.jpg", "China Sea Warehouse shipping label template", 760, 760),
        dgImage: img("/images/label-dg-2026-10c.jpg", "Dangerous Goods warehouse shipping label template", 760, 760),
      }, { anchor: "address" }],
      ["faq", { heading: "China questions", source: "category", category: "China & ocean shipping", exclude: "barrel" }],
      ["cta", {
        heading: "Ready to ship from China?",
        text: "Send us the item link or your order details. We'll confirm the best way to ship it.",
        buttons: [btn("WhatsApp us", wa("whatsapp-china", CHINA_HELLO), "gold"), btn("No account yet? Sign up free", REGISTER, "outline-light")],
      }],
    ]),

    builtin("faqs", "FAQs", "Shipping FAQs, USA & China to Jamaica", "Answers about getting started, shipping and tracking, invoices and customs, pickup and payments, and China and ocean shipping.", [
      ["hero", { style: "centered", heading: "Frequently asked", highlight: "questions", text: "Everything customers ask us most often, in one place. Still stuck? We're a message away." }],
      ["faqExplorer", { footnote: "Not sure if you can ship something? See the [restricted items](/restricted-items) list." }],
      ["helpContacts", { heading: "Still need help?", intro: "Send your name, SGX number, tracking number and a short description of your concern." }],
    ]),

    builtin("about", "About", "About Us, Courier & Freight in Jamaica", "SG Xpress Shipping offers express courier, freight forwarding, and air and ocean cargo, with delivery islandwide.", [
      ["hero", { heading: "Shipping built around you", text: "SG Xpress Shipping offers express courier, freight forwarding, and air and ocean cargo, with delivery islandwide." }],
      ["cards", {
        heading: "From the store to your door",
        columns: "4",
        cardStyle: "filled",
        items: [
          card({ icon: "box", title: "Express courier", text: "Within Jamaica and from the USA." }),
          card({ icon: "arrow", title: "Freight forwarding", text: "Your free US address, cleared through customs for you." }),
          card({ icon: "ship", title: "Air & ocean cargo", text: "USA Air, USA Ocean and China Direct." }),
          card({ icon: "pin", title: "Islandwide delivery", text: "Collect at a branch or get it delivered anywhere in Jamaica." }),
        ],
        moreLink: page("/#services"),
        moreLabel: "See all services",
      }],
      ["cards", {
        heading: "Shoppers and businesses",
        columns: "2",
        items: [
          { title: "Online shoppers", text: "Shop any US or China store, even without a credit card, and pick up close to home." },
          { title: "Businesses and their customers", text: "Bring in stock by air or sea, with commercial rates for larger volumes." },
        ],
      }, { tone: "mist" }],
      ["steps", {
        heading: "Our commitments",
        style: "list",
        items: [
          { title: "We meet your needs", text: "And the needs of your customers." },
          { title: "Service shaped to your request", text: "Flexible options, not one-size-fits-all." },
          { title: "Growing with you", text: "We expand our services as Jamaica's needs grow." },
          { title: "A good corporate citizen", text: "A sound business that serves all our stakeholders." },
        ],
      }],
      ["airSchedule", { heading: "USA air shipping schedule", intro: "SG Xpress normally ships from the USA to Jamaica three times weekly." }, { anchor: "air-schedule" }],
      ["warehouseHours", { heading: "Florida warehouse operating hours" }, { anchor: "warehouse-hours" }],
      ["branchLinks", { heading: "Visit us" }],
      ["cta", {
        heading: "Ship with SG Xpress",
        text: SIGN_UP_CTA_TEXT,
        buttons: [SIGN_UP, btn("Talk to us on WhatsApp", wa("whatsapp-general"), "outline-light")],
      }],
    ]),

    builtin("contact", "Contact", "Contact Us, Phone, WhatsApp & Branches", "Call, WhatsApp, email or send SG Xpress a message, or visit our Church Street and Clock branches.", [
      ["contactPanel", {
        heading: "Get in",
        highlight: "touch",
        formHeading: "Send a message",
        formIntro: "A question about a package, a rate or anything else? Fill in the form and we'll get back to you, usually within one business day.",
      }],
      ["branchCards", { heading: "Our branches" }],
    ]),

    builtin("careers", "Careers", "Careers in Shipping & Logistics, Jamaica", "Join the SG Xpress Shipping team in Jamaica. See current openings and apply online.", [
      ["hero", {
        heading: "Build your future",
        highlight: "with us",
        text: "We're always looking for friendly, reliable people who care about getting customers' packages home.",
        buttons: [btn("See current openings", page("#openings"), "gold"), btn("Send a general application", page("/careers/apply"), "outline-light")],
      }],
      ["cards", {
        cardStyle: "filled",
        items: [
          card({ icon: "arrow", title: "Learn and grow", text: "Build real skills in logistics, customs and customer service, and grow with the business." }),
          card({ icon: "users", title: "Work as one team", text: "A close team across our branches, warehouses and China Direct desk, helping each other get it right." }),
          card({ icon: "globe", title: "Connect Jamaica to the world", text: "Help customers shop the USA and China and get their packages home." }),
        ],
      }],
      ["jobs", {
        heading: "Current openings",
        emptyTitle: "No openings right now",
        emptyText: "We don't have any vacancies at the moment, but we'd still like to hear from you. Send your CV and we'll keep it on file.",
        moreHeading: "Don't see the right role?",
        moreText: "Send us your CV anyway. We'll keep it on file and contact you when something suitable opens.",
        applyLabel: "Send a general application",
        moreButton: "Apply anyway",
      }, { anchor: "openings" }],
    ]),

    builtin("restricted-items", "Restricted items", "Restricted Items for Import into Jamaica", "Items that need a permit to import into Jamaica, and which agency issues it.", [
      ["hero", { heading: "Restricted items", text: "These items need a permit before they can be imported into Jamaica. Shipping them without one can lead to delays, detention or fines." }],
      ["text", {
        heading: "Ask us first",
        body: "If you're not sure about an item, message us before you buy. From China, anything with batteries, liquids or powders ships as [dangerous goods](/china-direct#address).",
        buttons: [btn("Ask on WhatsApp", wa("whatsapp-general", "Hi SG Xpress, can I ship this item?"))],
      }],
      ["table", {
        heading: "Permits by agency",
        col1: "Item",
        col2: "You need",
        col3: "Issued by",
        rows: [
          ["Meat and animals", "Permit / certificate", "Ministry of Agriculture"],
          ["Red peas (red kidney beans)", "Permit / phytosanitary certificate", "Ministry of Agriculture"],
          ["Fruits, vegetables, plants and plant products", "Phytosanitary certificate / permit", "Ministry of Agriculture"],
          ["Ground provisions", "Phytosanitary certificate / permit", "Ministry of Agriculture"],
          ["Milk powder and milk-based products", "Licence / permit", "Ministry of Agriculture"],
          ["Pharmaceuticals, chemicals, herbal teas", "PSD certificate", "Pharmaceutical Regulatory Affairs, Ministry of Health"],
          ["Firearms and accessories, explosives, fireworks, swords", "Permit / licence to import", "Ministry of National Security / Trade Board"],
          ["Sugar", "Licence", "Trade Board"],
          ["Motor vehicles", "Licence", "Trade Board"],
          ["Coconut products, oil-producing seeds, edible oils, soaps", "Permit", "Coconut Industry Board"],
          ["Alcohol in bulk", "Spirit Pool permit", "Spirit Pool Association"],
          ["Human remains", "KSAH permit", "Kingston & St. Andrew Health Department"],
          ["Pesticides", "Permit", "Pesticides Control Authority"],
          ["Two-way radios", "Licence / approval", "Spectrum Management Authority"],
        ].map(([a, b, c]) => ({ a, b, c })),
      }],
      ["tiles", {
        heading: "Needs a Ministry of National Security permit",
        items: [
          "Camouflage clothing and material", "Bulletproof vests", "Crossbows", "Motorcycles over 700cc", "Spears", "Handcuffs",
          "Radar detectors", "Swords", "Toy guns", "Metal detectors", "Riot gear", "Gun cleaning kits", "Armoured trucks",
          "Gun holsters", "Bows and arrows", "Credit card scanners", "Gunpowder and cartridges", "Laser lights",
          "Dynamite and nitroglycerine", "Firecrackers and flares", "Pepper spray",
        ].map((text) => ({ text })),
        footnote: "Source: Jamaica Customs Agency. The list can change. Check [jacustoms.gov.jm](https://www.jacustoms.gov.jm) for the latest rules.",
      }],
    ]),

    builtin("terms", "Terms and conditions", "Terms and conditions", "Terms and conditions for shipping with SG Xpress Jamaica Limited: invoices, customs, storage, claims and more.", [
      ["hero", { heading: "Terms and conditions", text: "Terms and conditions of SG Xpress Jamaica Limited™." }],
      ["text", { body: TERMS_MD }],
    ]),

    builtin("privacy", "Privacy", "Privacy", "What personal information SG Xpress collects, how we use and share it, and your rights under Jamaica's Data Protection Act.", [
      ["hero", { heading: "Privacy", text: `How we handle your personal information. Last updated ${PRIVACY_LAST_UPDATED}.` }],
      ["text", { body: `${PRIVACY_MD.trim()}\n\nSee also our full [terms and conditions](/terms).` }],
    ]),
  ];
}
