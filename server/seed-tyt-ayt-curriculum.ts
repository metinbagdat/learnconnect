import { db } from "./db.js";
import { courses, modules, lessons } from "../shared/schema.js";
import { eq } from "drizzle-orm";

interface CurriculumStructure {
  courseName: { en: string; tr: string };
  courseDescription: { en: string; tr: string };
  modules: Array<{
    name: { en: string; tr: string };
    description: { en: string; tr: string };
    lessons: Array<{
      title: { en: string; tr: string };
      description: { en: string; tr: string };
      estimatedTime: number;
    }>;
  }>;
}

const tytAytCurriculum: CurriculumStructure[] = [
  // TYT Turkish
  {
    courseName: { en: "TYT Turkish Language", tr: "TYT Türkçe" },
    courseDescription: {
      en: "Master Turkish language fundamentals including grammar, reading comprehension, and written expression",
      tr: "Türk dili temellerini, dilbilgisi, okuma anlama ve yazılı anlatımı öğrenin"
    },
    modules: [
      {
        name: { en: "Language Knowledge", tr: "Dil Bilgisi" },
        description: {
          en: "Grammar foundations covering phonetics, morphology, and syntax",
          tr: "Ses bilgisi, sözcük yapısı ve cümle yapısını kapsayan dilbilgisi temelleri"
        },
        lessons: [
          {
            title: { en: "Phonetics and Sounds", tr: "Ses Bilgisi ve Sesler" },
            description: { en: "Turkish phonetic system", tr: "Türk ses sistemi" },
            estimatedTime: 20
          },
          {
            title: { en: "Word Structure and Morphology", tr: "Sözcük Yapısı ve Morfoloji" },
            description: { en: "Root, suffix, and word formation", tr: "Kök, ek ve sözcük yapımı" },
            estimatedTime: 25
          },
          {
            title: { en: "Syntax and Sentence Structure", tr: "Sözdizimi ve Cümle Yapısı" },
            description: { en: "Sentence components and structure", tr: "Cümle ögeleri ve yapısı" },
            estimatedTime: 25
          },
          {
            title: { en: "Spelling and Punctuation", tr: "Yazım ve İmla Kuralları" },
            description: { en: "Written expression rules", tr: "Yazılı anlatım kuralları" },
            estimatedTime: 20
          }
        ]
      },
      {
        name: { en: "Reading Comprehension", tr: "Okuma Anlama" },
        description: {
          en: "Develop skills to understand and analyze texts",
          tr: "Metinleri anlamak ve analiz etmek için beceri geliştirin"
        },
        lessons: [
          {
            title: { en: "Main Idea and Theme", tr: "Ana Fikir ve Tema" },
            description: { en: "Identifying central concepts", tr: "Merkezi kavramları belirleme" },
            estimatedTime: 20
          },
          {
            title: { en: "Context and Word Meaning", tr: "Bağlam ve Sözcük Anlamı" },
            description: { en: "Understanding words in context", tr: "Bağlamda sözcük anlamını anlama" },
            estimatedTime: 18
          },
          {
            title: { en: "Narrative Techniques", tr: "Anlatım Teknikleri" },
            description: { en: "Perspective and narrative styles", tr: "Bakış açısı ve anlatım tarzları" },
            estimatedTime: 22
          },
          {
            title: { en: "Poetry and Literary Devices", tr: "Şiir ve Edebî Sanatlar" },
            description: { en: "Understanding poetry elements", tr: "Şiir öğelerini anlama" },
            estimatedTime: 25
          }
        ]
      }
    ]
  },
  // TYT Mathematics
  {
    courseName: { en: "TYT Mathematics", tr: "TYT Matematik" },
    courseDescription: {
      en: "Comprehensive coverage of numbers, algebra, geometry, and data analysis",
      tr: "Sayılar, cebir, geometri ve veri analizi kapsamlı bir şekilde"
    },
    modules: [
      {
        name: { en: "Numbers and Algebra", tr: "Sayılar ve Cebir" },
        description: {
          en: "Number systems, equations, and algebraic problem solving",
          tr: "Sayı sistemleri, denklemler ve cebirsel problem çözme"
        },
        lessons: [
          {
            title: { en: "Number Sets", tr: "Sayı Kümeleri" },
            description: { en: "Natural, integer, rational, and real numbers", tr: "Doğal, tam, rasyonel ve reel sayılar" },
            estimatedTime: 20
          },
          {
            title: { en: "Divisibility and GCD/LCM", tr: "Bölünebilirlik ve OBEB/OKEK" },
            description: { en: "Prime factorization and divisibility rules", tr: "Asal çarpanlara ayırma ve bölünebilirlik kuralları" },
            estimatedTime: 22
          },
          {
            title: { en: "Equations and Inequalities", tr: "Denklem ve Eşitsizlikler" },
            description: { en: "Solving linear and quadratic equations", tr: "Birinci ve ikinci derece denklemleri çözme" },
            estimatedTime: 25
          },
          {
            title: { en: "Ratio, Proportion, and Percentages", tr: "Oran, Orantı ve Yüzde" },
            description: { en: "Problem solving with ratios", tr: "Oranlarla problem çözme" },
            estimatedTime: 20
          },
          {
            title: { en: "Applied Problem Solving", tr: "Uygulamalı Problem Çözme" },
            description: { en: "Mixture, work, speed problems", tr: "Karışım, iş, hız problemleri" },
            estimatedTime: 25
          }
        ]
      },
      {
        name: { en: "Geometry", tr: "Geometri" },
        description: {
          en: "Geometric shapes, properties, and spatial reasoning",
          tr: "Geometrik şekiller, özellikleri ve uzay tasarımı"
        },
        lessons: [
          {
            title: { en: "Basic Geometric Concepts", tr: "Temel Geometrik Kavramlar" },
            description: { en: "Points, lines, planes, and angles", tr: "Nokta, doğru, düzlem ve açılar" },
            estimatedTime: 18
          },
          {
            title: { en: "Triangles", tr: "Üçgenler" },
            description: { en: "Triangle properties and theorems", tr: "Üçgen özellikleri ve teoremleri" },
            estimatedTime: 25
          },
          {
            title: { en: "Quadrilaterals and Polygons", tr: "Dörtgenler ve Çokgenler" },
            description: { en: "Properties of quadrilaterals", tr: "Dörtgenlerin özellikleri" },
            estimatedTime: 20
          },
          {
            title: { en: "Circles", tr: "Çemberler" },
            description: { en: "Circle properties, circumference, area", tr: "Çember özellikleri, çevre, alan" },
            estimatedTime: 22
          },
          {
            title: { en: "Three-Dimensional Geometry", tr: "Üç Boyutlu Geometri" },
            description: { en: "Prisms, cylinders, pyramids, cones", tr: "Prizmalar, silindirler, piramitler, koniler" },
            estimatedTime: 25
          }
        ]
      },
      {
        name: { en: "Data Analysis and Probability", tr: "Veri Analizi ve Olasılık" },
        description: {
          en: "Statistics, counting principles, and probability theory",
          tr: "İstatistik, sayma ilkeleri ve olasılık teorisi"
        },
        lessons: [
          {
            title: { en: "Data Measures", tr: "Veri Ölçüleri" },
            description: { en: "Mean, median, mode, range, standard deviation", tr: "Ortalama, medyan, mod, değer aralığı" },
            estimatedTime: 20
          },
          {
            title: { en: "Counting Principles", tr: "Sayma İlkeleri" },
            description: { en: "Permutation and combination", tr: "Permütasyon ve kombinasyon" },
            estimatedTime: 25
          },
          {
            title: { en: "Probability", tr: "Olasılık" },
            description: { en: "Basic probability theory and problems", tr: "Temel olasılık teorisi ve problemleri" },
            estimatedTime: 22
          }
        ]
      }
    ]
  },
  // TYT Science (Physics, Chemistry, Biology)
  {
    courseName: { en: "TYT Physics", tr: "TYT Fizik" },
    courseDescription: {
      en: "Fundamental physics concepts covering mechanics, waves, electricity, and modern physics",
      tr: "Mekanik, dalgalar, elektrik ve modern fiziği kapsayan temel fizik kavramları"
    },
    modules: [
      {
        name: { en: "Mechanics", tr: "Mekanik" },
        description: {
          en: "Motion, forces, energy, and work",
          tr: "Hareket, kuvvetler, enerji ve iş"
        },
        lessons: [
          {
            title: { en: "Vectors and Forces", tr: "Vektörler ve Kuvvetler" },
            description: { en: "Vector operations and force concepts", tr: "Vektör işlemleri ve kuvvet kavramları" },
            estimatedTime: 20
          },
          {
            title: { en: "Linear Motion", tr: "Doğrusal Hareket" },
            description: { en: "Kinematics and dynamics", tr: "Kinematik ve dinamik" },
            estimatedTime: 22
          },
          {
            title: { en: "Circular Motion", tr: "Dairesel Hareket" },
            description: { en: "Angular velocity and centripetal force", tr: "Açısal hız ve merkezkaç kuvveti" },
            estimatedTime: 20
          },
          {
            title: { en: "Energy and Work", tr: "Enerji ve İş" },
            description: { en: "Work-energy theorem and energy conservation", tr: "İş-enerji teoremi ve enerji korunumu" },
            estimatedTime: 22
          }
        ]
      },
      {
        name: { en: "Waves and Optics", tr: "Dalgalar ve Optik" },
        description: {
          en: "Sound waves, light, and optical phenomena",
          tr: "Ses dalgaları, ışık ve optik olayları"
        },
        lessons: [
          {
            title: { en: "Wave Properties", tr: "Dalga Özellikleri" },
            description: { en: "Frequency, wavelength, amplitude", tr: "Frekans, dalga boyu, genlik" },
            estimatedTime: 18
          },
          {
            title: { en: "Sound Waves", tr: "Ses Dalgaları" },
            description: { en: "Sound propagation and properties", tr: "Ses yayılımı ve özellikleri" },
            estimatedTime: 18
          },
          {
            title: { en: "Light and Optics", tr: "Işık ve Optik" },
            description: { en: "Reflection, refraction, lenses", tr: "Yansıma, kırılma, lensler" },
            estimatedTime: 22
          }
        ]
      },
      {
        name: { en: "Electricity and Magnetism", tr: "Elektrik ve Manyetizm" },
        description: {
          en: "Electric fields, circuits, and magnetic phenomena",
          tr: "Elektrik alanları, devreler ve manyetik olaylar"
        },
        lessons: [
          {
            title: { en: "Static Electricity", tr: "Statik Elektrik" },
            description: { en: "Charges and electric fields", tr: "Yükler ve elektrik alanları" },
            estimatedTime: 20
          },
          {
            title: { en: "Electric Circuits", tr: "Elektrik Devreleri" },
            description: { en: "Ohm's law, resistors, current", tr: "Ohm kanunu, dirençler, akım" },
            estimatedTime: 22
          },
          {
            title: { en: "Magnetism", tr: "Manyetizm" },
            description: { en: "Magnetic fields and forces", tr: "Manyetik alanlar ve kuvvetler" },
            estimatedTime: 20
          }
        ]
      }
    ]
  },
  {
    courseName: { en: "TYT Chemistry", tr: "TYT Kimya" },
    courseDescription: {
      en: "Chemistry fundamentals covering atomic structure, bonding, reactions, and everyday applications",
      tr: "Atom yapısı, kimyasal bağlar, reaksiyonlar ve günlük uygulamaları kapsayan kimya temelleri"
    },
    modules: [
      {
        name: { en: "Atomic Structure", tr: "Atom Yapısı" },
        description: {
          en: "Atoms, elements, and the periodic table",
          tr: "Atomlar, elementler ve periyodik tablo"
        },
        lessons: [
          {
            title: { en: "Atom and Subatomic Particles", tr: "Atom ve Subatomik Parçacıklar" },
            description: { en: "Protons, neutrons, electrons", tr: "Protonlar, nötronlar, elektronlar" },
            estimatedTime: 20
          },
          {
            title: { en: "Periodic Table", tr: "Periyodik Tablo" },
            description: { en: "Element organization and trends", tr: "Element organizasyonu ve eğilimleri" },
            estimatedTime: 22
          },
          {
            title: { en: "Electron Configuration", tr: "Elektron Konfigürasyonu" },
            description: { en: "Orbitals and energy levels", tr: "Yörüngeler ve enerji seviyeleri" },
            estimatedTime: 18
          }
        ]
      },
      {
        name: { en: "Chemical Bonding", tr: "Kimyasal Bağlar" },
        description: {
          en: "Ionic, covalent, and metallic bonds",
          tr: "İyonik, kovalent ve metal bağları"
        },
        lessons: [
          {
            title: { en: "Ionic Bonding", tr: "İyonik Bağ" },
            description: { en: "Formation and properties of ionic compounds", tr: "İyonik bileşiklerin oluşumu ve özellikleri" },
            estimatedTime: 20
          },
          {
            title: { en: "Covalent Bonding", tr: "Kovalent Bağ" },
            description: { en: "Molecular structure and polarity", tr: "Moleküler yapı ve polarite" },
            estimatedTime: 22
          },
          {
            title: { en: "Metallic Bonding", tr: "Metal Bağı" },
            description: { en: "Properties of metals", tr: "Metallerin özellikleri" },
            estimatedTime: 18
          }
        ]
      },
      {
        name: { en: "Reactions and Stoichiometry", tr: "Reaksiyonlar ve Stokiyometri" },
        description: {
          en: "Chemical reactions and calculations",
          tr: "Kimyasal reaksiyonlar ve hesaplamalar"
        },
        lessons: [
          {
            title: { en: "Types of Reactions", tr: "Reaksiyon Türleri" },
            description: { en: "Synthesis, decomposition, combustion", tr: "Sentez, ayrışma, yanma reaksiyonları" },
            estimatedTime: 20
          },
          {
            title: { en: "Stoichiometry", tr: "Stokiyometri" },
            description: { en: "Molar ratios and calculations", tr: "Mol oranları ve hesaplamalar" },
            estimatedTime: 25
          },
          {
            title: { en: "Acids, Bases, and Salts", tr: "Asitler, Bazlar ve Tuzlar" },
            description: { en: "pH, neutralization, properties", tr: "pH, nötrleştirme, özellikler" },
            estimatedTime: 20
          }
        ]
      }
    ]
  },
  {
    courseName: { en: "TYT Biology", tr: "TYT Biyoloji" },
    courseDescription: {
      en: "Biology fundamentals including cell structure, genetics, ecology, and living systems",
      tr: "Hücre yapısı, genetik, ekoloji ve yaşayan sistemleri kapsayan biyoloji temelleri"
    },
    modules: [
      {
        name: { en: "Cell and Life", tr: "Hücre ve Yaşam" },
        description: {
          en: "Cell structure, function, and characteristics of living things",
          tr: "Hücre yapısı, fonksiyonu ve canlıların özellikleri"
        },
        lessons: [
          {
            title: { en: "Characteristics of Living Things", tr: "Canlıların Özellikleri" },
            description: { en: "Organization, metabolism, reproduction", tr: "Organizasyon, metabolizma, üreme" },
            estimatedTime: 18
          },
          {
            title: { en: "Cell Structure and Organelles", tr: "Hücre Yapısı ve Organelller" },
            description: { en: "Prokaryotic and eukaryotic cells", tr: "Prokaryotik ve ökaryotik hücreler" },
            estimatedTime: 22
          },
          {
            title: { en: "Cell Division", tr: "Hücre Bölünmesi" },
            description: { en: "Mitosis and meiosis", tr: "Mitoz ve mayoz" },
            estimatedTime: 20
          }
        ]
      },
      {
        name: { en: "Genetics and Heredity", tr: "Genetik ve Kalıtım" },
        description: {
          en: "Inheritance, DNA, and genetic principles",
          tr: "Kalıtım, DNA ve genetik ilkeleri"
        },
        lessons: [
          {
            title: { en: "Mendelian Inheritance", tr: "Mendeliyen Kalıtımı" },
            description: { en: "Genes, alleles, and Punnett squares", tr: "Genler, allellar ve Punnett kareleri" },
            estimatedTime: 22
          },
          {
            title: { en: "DNA and Protein Synthesis", tr: "DNA ve Protein Sentezi" },
            description: { en: "Replication, transcription, translation", tr: "Replikasyon, transkripsiyon, translasyon" },
            estimatedTime: 25
          },
          {
            title: { en: "Genetic Variation", tr: "Genetik Varyasyon" },
            description: { en: "Mutations and genetic diversity", tr: "Mutasyonlar ve genetik çeşitlilik" },
            estimatedTime: 18
          }
        ]
      },
      {
        name: { en: "Ecology and Evolution", tr: "Ekoloji ve Evrim" },
        description: {
          en: "Ecosystems, populations, and adaptation",
          tr: "Ekosistemler, popülasyonlar ve adaptasyon"
        },
        lessons: [
          {
            title: { en: "Ecosystems", tr: "Ekosistemler" },
            description: { en: "Energy flow and nutrient cycles", tr: "Enerji akışı ve besin döngüleri" },
            estimatedTime: 20
          },
          {
            title: { en: "Populations and Communities", tr: "Popülasyonlar ve Topluluklar" },
            description: { en: "Population dynamics and interactions", tr: "Popülasyon dinamiği ve etkileşimler" },
            estimatedTime: 20
          },
          {
            title: { en: "Evolution and Natural Selection", tr: "Evrim ve Doğal Seçilim" },
            description: { en: "Adaptation and biodiversity", tr: "Adaptasyon ve biyoçeşitlilik" },
            estimatedTime: 22
          }
        ]
      }
    ]
  },
  // TYT Social Sciences
  {
    courseName: { en: "TYT History", tr: "TYT Tarih" },
    courseDescription: {
      en: "Turkish and world history including Ottoman Empire and modern era",
      tr: "Türk ve dünya tarihi, Osmanlı İmparatorluğu ve modern dönem"
    },
    modules: [
      {
        name: { en: "Early Turkish States", tr: "Erken Türk Devletleri" },
        description: {
          en: "Huns, Göktürks, and first Muslim Turkish states",
          tr: "Hunlar, Göktürkler ve ilk Müslüman Türk devletleri"
        },
        lessons: [
          {
            title: { en: "Pre-Islamic Turkish States", tr: "İslamöncesi Türk Devletleri" },
            description: { en: "Huns and Göktürks", tr: "Hunlar ve Göktürkler" },
            estimatedTime: 18
          },
          {
            title: { en: "First Muslim Turkish States", tr: "İlk Müslüman Türk Devletleri" },
            description: { en: "Karahanids and Ghaznavids", tr: "Karahanlılar ve Gazneliler" },
            estimatedTime: 20
          }
        ]
      },
      {
        name: { en: "Ottoman Empire", tr: "Osmanlı İmparatorluğu" },
        description: {
          en: "Rise, zenith, and decline of Ottoman Empire",
          tr: "Osmanlı İmparatorluğu'nun yükselişi, en parlak dönemi ve düşüşü"
        },
        lessons: [
          {
            title: { en: "Rise of the Ottomans", tr: "Osmanlı'nın Yükselişi" },
            description: { en: "Foundation and early expansion", tr: "Kuruluş ve erken genişleme" },
            estimatedTime: 20
          },
          {
            title: { en: "Classical Age", tr: "Klasik Dönem" },
            description: { en: "Peak of Ottoman power and culture", tr: "Osmanlı gücü ve kültürünün zirvesi" },
            estimatedTime: 22
          },
          {
            title: { en: "Decline and Reform", tr: "Gerileme ve Reform" },
            description: { en: "Tanzimat reforms and modernization", tr: "Tanzimat reformları ve modernizasyon" },
            estimatedTime: 22
          }
        ]
      },
      {
        name: { en: "Modern Turkey", tr: "Modern Türkiye" },
        description: {
          en: "War of Independence, Atatürk reforms, and modern era",
          tr: "Bağımsızlık Savaşı, Atatürk reformları ve modern dönem"
        },
        lessons: [
          {
            title: { en: "War of Independence", tr: "Bağımsızlık Savaşı" },
            description: { en: "Turkish War of Independence 1919-1923", tr: "Türk Bağımsızlık Savaşı 1919-1923" },
            estimatedTime: 20
          },
          {
            title: { en: "Atatürk's Reforms", tr: "Atatürk Reformları" },
            description: { en: "Modernization and reforms", tr: "Modernizasyon ve reformlar" },
            estimatedTime: 22
          }
        ]
      }
    ]
  },
  {
    courseName: { en: "TYT Geography", tr: "TYT Coğrafya" },
    courseDescription: {
      en: "Physical and human geography including Turkey's geography",
      tr: "Fiziki ve beşeri coğrafya, Türkiye coğrafyası"
    },
    modules: [
      {
        name: { en: "Physical Geography", tr: "Fiziki Coğrafya" },
        description: {
          en: "Earth systems, climate, and natural features",
          tr: "Dünya sistemleri, iklim ve doğal özellikler"
        },
        lessons: [
          {
            title: { en: "Earth and Maps", tr: "Dünya ve Haritalar" },
            description: { en: "Earth's shape, movements, map types", tr: "Dünya şekli, hareketleri, harita türleri" },
            estimatedTime: 18
          },
          {
            title: { en: "Climate Systems", tr: "İklim Sistemleri" },
            description: { en: "Weather, climate zones, precipitation", tr: "Hava, iklim bölgeleri, yağış" },
            estimatedTime: 20
          },
          {
            title: { en: "Natural Regions", tr: "Doğal Bölgeler" },
            description: { en: "Biomes and ecosystems", tr: "Biyomlar ve ekosistemler" },
            estimatedTime: 18
          }
        ]
      },
      {
        name: { en: "Human Geography", tr: "Beşeri Coğrafya" },
        description: {
          en: "Population, settlements, and human activities",
          tr: "Nüfus, yerleşimler ve insan aktiviteleri"
        },
        lessons: [
          {
            title: { en: "Population Geography", tr: "Nüfus Coğrafyası" },
            description: { en: "Population distribution and demographics", tr: "Nüfus dağılımı ve demografi" },
            estimatedTime: 18
          },
          {
            title: { en: "Settlements and Urbanization", tr: "Yerleşimler ve Kentleşme" },
            description: { en: "Urban and rural areas", tr: "Kentsel ve kırsal alanlar" },
            estimatedTime: 20
          }
        ]
      },
      {
        name: { en: "Turkey's Geography", tr: "Türkiye Coğrafyası" },
        description: {
          en: "Turkey's location, relief, climate, and economy",
          tr: "Türkiye'nin konumu, coğrafi koşulları, iklimi ve ekonomisi"
        },
        lessons: [
          {
            title: { en: "Location and Relief", tr: "Konum ve Coğrafik Koşullar" },
            description: { en: "Turkey's strategic position", tr: "Türkiye'nin stratejik konumu" },
            estimatedTime: 18
          },
          {
            title: { en: "Climate and Vegetation", tr: "İklim ve Vejetasyon" },
            description: { en: "Regional climate differences", tr: "Bölgesel iklim farklılıkları" },
            estimatedTime: 18
          },
          {
            title: { en: "Economic Geography", tr: "Ekonomik Coğrafya" },
            description: { en: "Resources and economic activities", tr: "Kaynaklar ve ekonomik aktiviteler" },
            estimatedTime: 20
          }
        ]
      }
    ]
  }
];

export async function seedTytAytCurriculum() {
  try {
    // Check if TYT/AYT courses already exist
    const allCourses = await db.select().from(courses);
    const existingTytCourses = allCourses.filter(c => c.titleEn?.includes("TYT") || c.title?.includes("TYT"));
    
    if (existingTytCourses.length > 0) {
      console.log(`TYT/AYT curriculum already exists (${existingTytCourses.length} courses found)`);
      return;
    }
    
    console.log("Seeding TYT/AYT curriculum...");
    
    let courseCount = 0;
    let moduleCount = 0;
    let lessonCount = 0;
    
    for (const curriculum of tytAytCurriculum) {
      // Create course
      const insertedCourse = await db
        .insert(courses)
        .values({
          title: curriculum.courseName.en,
          description: curriculum.courseDescription.en,
          titleEn: curriculum.courseName.en,
          titleTr: curriculum.courseName.tr,
          descriptionEn: curriculum.courseDescription.en,
          descriptionTr: curriculum.courseDescription.tr,
          category: curriculum.courseName.en.includes("TYT") ? "TYT" : "AYT",
          moduleCount: curriculum.modules.length,
          durationHours: curriculum.modules.length * 5,
          instructorId: 1,
          level: "Beginner",
          isAiGenerated: false
        })
        .returning({ id: courses.id });
      
      if (insertedCourse.length === 0) continue;
      
      const courseId = insertedCourse[0].id;
      courseCount++;
      
      // Create modules
      for (let i = 0; i < curriculum.modules.length; i++) {
        const module = curriculum.modules[i];
        
        const insertedModule = await db
          .insert(modules)
          .values({
            courseId: courseId,
            title: module.name.en,
            description: module.description.en,
            titleEn: module.name.en,
            titleTr: module.name.tr,
            descriptionEn: module.description.en,
            descriptionTr: module.description.tr,
            order: i
          })
          .returning({ id: modules.id });
        
        if (insertedModule.length === 0) continue;
        
        const moduleId = insertedModule[0].id;
        moduleCount++;
        
        // Create lessons
        for (let j = 0; j < module.lessons.length; j++) {
          const lesson = module.lessons[j];
          
          await db
            .insert(lessons)
            .values({
              moduleId: moduleId,
              title: lesson.title.en,
              content: lesson.description.en,
              titleEn: lesson.title.en,
              titleTr: lesson.title.tr,
              contentEn: lesson.description.en,
              contentTr: lesson.description.tr,
              descriptionEn: lesson.description.en,
              descriptionTr: lesson.description.tr,
              order: j,
              estimatedTime: lesson.durationMinutes,
              tags: ["exam", "tyt", "ayt", curriculum.courseName.en.toLowerCase().replace(/\s+/g, "-")]
            });
          
          
          lessonCount++;
        }
      }
    }
    
    console.log(`✓ TYT/AYT Curriculum seeded: ${courseCount} courses, ${moduleCount} modules, ${lessonCount} lessons`);
  } catch (error) {
    console.error("Error seeding TYT/AYT curriculum:", error);
  }
}
