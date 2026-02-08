import type { WasteType } from '../utils/types';

export type LearnCardType = 'tip' | 'myth' | 'impact';

export type LearnCard = {
  id: string;
  type: LearnCardType;
  title: string;
  body: string;
  wasteType?: WasteType;
};

export type WasteGuide = {
  wasteType: Exclude<WasteType, 'unknown'>;
  headline: string;
  dos: string[];
  donts: string[];
  note?: string;
};

export const LEARN_CARDS: LearnCard[] = [
  {
    id: 'tip_glass_only_bottles',
    type: 'tip',
    title: 'Biliyor muydunuz? Camda sadece şişe ve kavanozlar',
    body: 'Isıya dayanıklı camlar (borcam), aynalar, pencere camları ve kristaller farklı bileşimdedir. Cam kutusuna yalnızca şişe ve kavanoz atın.',
    wasteType: 'glass',
  },
  {
    id: 'tip_glass_broken_safe',
    type: 'tip',
    title: 'Geri Dönüşüm Kahramanı Olun: Kırık camı güvenli paketleyin',
    body: 'Kırık camlar geri dönüştürülebilir ama toplama personeli için risklidir. Parçaları güvenli şekilde sarıp kutuya atın.',
    wasteType: 'glass',
  },
  {
    id: 'tip_paper_pizza',
    type: 'tip',
    title: 'Biliyor muydunuz? Pizza kutusunun yağı sorun',
    body: 'Yağ, kağıt liflerini bozar. Temiz ve kuru kısımlar geri dönüşüme, yağlı kısımlar evsel atığa.',
    wasteType: 'paper',
  },
  {
    id: 'tip_paper_small',
    type: 'tip',
    title: 'Biliyor muydunuz? Konfeti ve fişler geri kazanılamaz',
    body: 'Çok küçük kağıt parçaları ayıklamada dökülür. Termal yazarkasa fişleri (BPA içerdiği için) kağıt döngüsüne girmemeli.',
    wasteType: 'paper',
  },
  {
    id: 'tip_plastic_symbol',
    type: 'tip',
    title: 'Biliyor muydunuz? Üçgen sembol her zaman geri dönüşüm demek değil',
    body: 'Sembol sadece türü belirtir; 7 numara veya bazı 3 numara (PVC) plastikler çoğu tesiste işlenemez. Yerel kurallara bakın.',
    wasteType: 'plastic',
  },
  {
    id: 'tip_plastic_caps',
    type: 'tip',
    title: 'Geri Dönüşüm Kahramanı Olun: Kapakları şişede bırakın',
    body: 'Modern tesisler kapakları ayırabilir. Kapakları şişenin üzerinde bırakmak küçük kapakların kaybolmasını önler.',
    wasteType: 'plastic',
  },
  {
    id: 'tip_battery_dropoff',
    type: 'tip',
    title: 'Biliyor muydunuz? Piller özel toplama ister',
    body: 'Piller ağır metal içerir ve çöplükte sızıntı yapabilir. Mutlaka atık pil toplama noktalarına bırakın.',
    wasteType: 'battery',
  },
  {
    id: 'tip_battery_life',
    type: 'tip',
    title: 'Biliyor muydunuz? Şarjlı pillerin de ömrü var',
    body: 'Şarj tutmayan piller de normal piller gibi özel toplama kutularına gitmelidir.',
    wasteType: 'battery',
  },
  {
    id: 'myth_glass_all',
    type: 'myth',
    title: 'Mit: “Her türlü cam geri dönüşüm kutusuna atılabilir.”',
    body: 'Gerçek: Isıya dayanıklı camlar (borcam), aynalar, pencere camları ve kristaller farklı kimyasal bileşimlere sahiptir. Bunlar normal şişe ve kavanozlarla karışırsa tüm partiyi bozar. Sadece şişe ve kavanozları atın.',
    wasteType: 'glass',
  },
  {
    id: 'myth_glass_broken',
    type: 'myth',
    title: 'Mit: “Kırık camlar geri dönüştürülemez.”',
    body: 'Gerçek: Kırık camlar geri dönüştürülebilir ancak toplama personeli için ciddi güvenlik riski oluşturur. Kırık parçaları güvenli bir şekilde paketleyerek kutuya atmak en doğrusudur.',
    wasteType: 'glass',
  },
  {
    id: 'myth_paper_pizza',
    type: 'myth',
    title: 'Mit: “Pizza kutuları kağıt geri dönüşümüne girer.”',
    body: 'Gerçek: Kağıt geri dönüşümünün en büyük düşmanı yağdır. Yağlanmış pizza kutuları kağıt liflerini bozar. Sadece temiz ve kuru kısımları geri dönüştürün, yağlı kısımları evsel atığa atın.',
    wasteType: 'paper',
  },
  {
    id: 'myth_paper_small',
    type: 'myth',
    title: 'Mit: “Küçük kağıt parçaları (konfeti, fiş vb.) geri dönüştürülebilir.”',
    body: 'Gerçek: Çok küçük parçalar ayıklama makinelerinden dökülür ve geri kazanılamaz. Ayrıca termal yazarkasa fişleri (BPA içerdiği için) kağıt döngüsüne sokulmamalıdır.',
    wasteType: 'paper',
  },
  {
    id: 'myth_plastic_symbol',
    type: 'myth',
    title: 'Mit: “Üzerinde geri dönüşüm sembolü (üçgen) olan her plastik geri dönüşür.”',
    body: 'Gerçek: Üçgen sadece plastiğin türünü belirtir. Örneğin 7 numara (diğer) veya bazı 3 numara (PVC) plastikler çoğu tesiste işlenemez. Yerel belediyenizin hangi numaraları kabul ettiğini kontrol edin.',
    wasteType: 'plastic',
  },
  {
    id: 'myth_plastic_caps',
    type: 'myth',
    title: 'Mit: “Plastik şişelerin kapaklarını çıkarıp atmalıyım.”',
    body: 'Gerçek: Eskiden öyleydi ancak modern tesisler kapakları ayırabiliyor. Kapakları şişenin üzerinde bırakmak, küçük kapakların kaybolup doğaya karışmasını engeller.',
    wasteType: 'plastic',
  },
  {
    id: 'myth_battery_trash',
    type: 'myth',
    title: 'Mit: “Piller bittiğinde normal çöp kutusuna atılabilir, çevreye zarar vermez.”',
    body: 'Gerçek: Piller cıva, kurşun ve kadmiyum gibi ağır metaller içerir. Çöplükte sızıntı yaparak yeraltı sularına ve toprağa karışırlar. Mutlaka atık pil toplama noktalarına bırakılmalıdır.',
    wasteType: 'battery',
  },
  {
    id: 'myth_battery_forever',
    type: 'myth',
    title: 'Mit: “Şarj edilebilir piller sonsuza kadar kullanılabilir.”',
    body: 'Gerçek: Her pilin bir ömrü vardır. Şarj tutmamaya başladığında, özel toplama kutularına gitmelidir.',
    wasteType: 'battery',
  },
  {
    id: 'impact_paper_trees',
    type: 'impact',
    title: '1 ton kağıt = 17 ağaç',
    body: '1 ton kağıdı geri dönüştürerek 17 ağacın kesilmesini önleyebilirsiniz.',
  },
  {
    id: 'impact_aluminum_energy',
    type: 'impact',
    title: '1 alüminyum kutu = 3 saat TV',
    body: '1 adet alüminyum kutunun geri dönüşümü, bir televizyonu 3 saat çalıştıracak enerji tasarrufu sağlar.',
  },
  {
    id: 'impact_glass_infinite',
    type: 'impact',
    title: 'Cam sonsuz kez geri dönüştürülebilir',
    body: 'Cam, kalitesinden hiçbir şey kaybetmeden sonsuz kez geri dönüştürülebilir.',
  },
];

export const WASTE_GUIDES: WasteGuide[] = [
  {
    wasteType: 'plastic',
    headline: 'Plastik: temiz ve boş tutun',
    dos: [
      'Boşalt ve durula — Kapları boşaltıp hızlıca durulayın',
      'Artıkları çıkar — Yiyecek kalıntılarını mümkünse temizleyin',
      'Ayrı tut — Geri dönüşümleri poşete koymadan koyun',
    ],
    donts: [
      'Çok kirli plastik koyma — Ağır kirli atıklar reddedilebilir',
      'Her plastik kabul edilir sanma — Yerel kuralları kontrol edin',
    ],
  },
  {
    wasteType: 'paper',
    headline: 'Kağıt: kuru tutun',
    dos: ['Temiz ve kuru tut — Kuru kağıt daha kolay ayrıştırılır', 'Kartonları düzleştir — Daha az yer kaplar'],
    donts: [
      'Yağlı/lekeli kağıt koyma — Geri dönüşümü bozar',
      'Islak kağıt koyma — Çoğu zaman kabul edilmez',
    ],
  },
  {
    wasteType: 'glass',
    headline: 'Cam: güvenli şekilde taşıyın',
    dos: [
      'Boşalt ve durula — Kavanoz/şişeleri temizleyin',
      'Yerel kurala göre ayır — Renk ayrımı istenebilir',
    ],
    donts: [
      'Kırık camı korumasız atma — Güvenli şekilde sarın',
      'Seramik karıştırma — Camla aynı değildir',
    ],
  },
  {
    wasteType: 'metal',
    headline: 'Metal: kutular ve folyo',
    dos: ['Boşalt ve durula — Kutuları temizleyin', 'Gerekirse düzleştir — Yerel kurallara uyun'],
    donts: [
      'Basınçlı kutu koyma — Kabul edilmeyebilir',
      'Karışık malzeme koyma — Mümkünse ayırın',
    ],
  },
  {
    wasteType: 'battery',
    headline: 'Piller tehlikelidir',
    dos: ['Toplama noktasına götür — Pil kutularını kullanın', 'Kutupları bantla — Yangın riskini azaltır'],
    donts: ['Çöpe atma — Tehlikelidir', 'Delme/ezme — Güvenlik riski'],
    note: 'Güvenlik notu: Piller çöpte ve geri dönüşüm tesislerinde yangına neden olabilir.',
  },
];

export type QuizQuestion = {
  id: string;
  item: string;
  correctWasteType: Exclude<WasteType, 'unknown'>;
  explanation: string;
};

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 'q_newspaper',
    item: 'Günlük haber sayfaları',
    correctWasteType: 'paper',
    explanation: 'Temiz kağıt, kağıt (mavi) kutusuna gider.',
  },
  {
    id: 'q_sodacan',
    item: 'İçecek kutusu',
    correctWasteType: 'metal',
    explanation: 'Alüminyum kutular metal (gri) geri dönüşümdür.',
  },
  {
    id: 'q_plasticbottle',
    item: 'İçecek şişesi',
    correctWasteType: 'plastic',
    explanation: 'Plastik şişeler genellikle plastik (sarı) geri dönüşüme gider.',
  },
  {
    id: 'q_glassjar',
    item: 'Reçel kabı',
    correctWasteType: 'glass',
    explanation: 'Cam kaplar cam (yeşil) olarak ayrılır.',
  },
  {
    id: 'q_aabattery',
    item: 'Kumandadan çıkan AA hücre',
    correctWasteType: 'battery',
    explanation: 'AA/AAA hücreler tehlikelidir ve özel toplama gerektirir.',
  },
  {
    id: 'q_yogurtcup',
    item: 'Süt ürünü kabı',
    correctWasteType: 'plastic',
    explanation: 'Temizlenmiş plastik kaplar plastik (sarı) kutusuna gider.',
  },
  {
    id: 'q_shampoo',
    item: 'Banyo ürünü şişesi',
    correctWasteType: 'plastic',
    explanation: 'Şampuan şişeleri plastik geri dönüşüme uygundur.',
  },
  {
    id: 'q_cartonbox',
    item: 'Paket kutusu',
    correctWasteType: 'paper',
    explanation: 'Kartonlar kağıt (mavi) kutusuna atılır.',
  },
  {
    id: 'q_magazine',
    item: 'Renkli sayfalar',
    correctWasteType: 'paper',
    explanation: 'Dergiler temiz ise kağıt geri dönüşüme gider.',
  },
  {
    id: 'q_envelope',
    item: 'Mektup zarfı',
    correctWasteType: 'paper',
    explanation: 'Zarflar temiz ise kağıt geri dönüşüme uygundur.',
  },
  {
    id: 'q_tomato_can',
    item: 'Konserve kabı',
    correctWasteType: 'metal',
    explanation: 'Konserve kutuları metal (gri) geri dönüşümdedir.',
  },
  {
    id: 'q_foil',
    item: 'Tepsi kaplama yaprağı',
    correctWasteType: 'metal',
    explanation: 'Temiz folyo metal geri dönüşüme gidebilir.',
  },
  {
    id: 'q_wine_bottle',
    item: 'Alkollü içecek şişesi',
    correctWasteType: 'glass',
    explanation: 'Şişeler cam (yeşil) geri dönüşüme ayrılır.',
  },
  {
    id: 'q_pickle_jar',
    item: 'Turşu kabı',
    correctWasteType: 'glass',
    explanation: 'Kavanozlar cam geri dönüşüme uygundur.',
  },
  {
    id: 'q_detergent_bottle',
    item: 'Temizlik ürünü şişesi',
    correctWasteType: 'plastic',
    explanation: 'Boş ve durulanmış deterjan şişeleri plastik geri dönüşüme gider.',
  },
  {
    id: 'q_takeaway_box',
    item: 'Paket yemek kabı',
    correctWasteType: 'plastic',
    explanation: 'Temizlenmiş yemek kapları plastik geri dönüşüme uygundur.',
  },
  {
    id: 'q_notebook_page',
    item: 'Çizgili sayfa',
    correctWasteType: 'paper',
    explanation: 'Temiz defter sayfaları kağıt (mavi) kutusuna gider.',
  },
  {
    id: 'q_book_page',
    item: 'Basılı sayfa',
    correctWasteType: 'paper',
    explanation: 'Kitap sayfaları temiz ise kağıt geri dönüşümüne atılır.',
  },
  {
    id: 'q_perfume_bottle',
    item: 'Koku ürünü şişesi',
    correctWasteType: 'glass',
    explanation: 'Parfüm şişeleri cam (yeşil) olarak ayrılır.',
  },
  {
    id: 'q_oil_bottle',
    item: 'Mutfak yağı şişesi',
    correctWasteType: 'glass',
    explanation: 'Cam yağ şişeleri cam geri dönüşüme uygundur.',
  },
  {
    id: 'q_can_lid',
    item: 'Konserve üst kapağı',
    correctWasteType: 'metal',
    explanation: 'Konserve kapakları metal geri dönüşüme girer.',
  },
  {
    id: 'q_soda_cap',
    item: 'Gazoz kapağı',
    correctWasteType: 'metal',
    explanation: 'Gazoz kapakları metal geri dönüşüme uygundur.',
  },
  {
    id: 'q_watch_cell',
    item: 'Saatten çıkan düğme hücre',
    correctWasteType: 'battery',
    explanation: 'Düğme hücreleri tehlikelidir ve özel toplama ister.',
  },
  {
    id: 'q_smoke_alarm',
    item: 'Duman dedektöründeki 9V',
    correctWasteType: 'battery',
    explanation: '9V hücreler atık pil kutularına bırakılmalıdır.',
  },
];
