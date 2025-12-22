import { db } from "./db.js";
import { courses, modules, lessons } from "../shared/schema.js";
import { eq } from "drizzle-orm";

interface ModuleData {
  titleEn: string;
  titleTr: string;
  descriptionEn: string;
  descriptionTr: string;
}

interface LessonData {
  titleEn: string;
  titleTr: string;
  contentEn: string;
  contentTr: string;
  descriptionEn: string;
  descriptionTr: string;
  estimatedTime: number;
}

// Module templates for different course types
const moduleTemplates: Record<string, ModuleData[]> = {
  default: [
    {
      titleEn: "Foundations",
      titleTr: "Temel Kavramlar",
      descriptionEn: "Master the fundamental concepts and key principles",
      descriptionTr: "Temel kavramları ve kilit ilkeleri öğrenin"
    },
    {
      titleEn: "Core Concepts",
      titleTr: "Çekirdek Konular",
      descriptionEn: "Deep dive into the main topics and theories",
      descriptionTr: "Ana konuları ve teorileri derinlemesine inceleyin"
    },
    {
      titleEn: "Practical Applications",
      titleTr: "Pratik Uygulamalar",
      descriptionEn: "Learn real-world applications and use cases",
      descriptionTr: "Gerçek dünya uygulamalarını ve kullanım örneklerini öğrenin"
    },
    {
      titleEn: "Advanced Topics",
      titleTr: "İleri Konular",
      descriptionEn: "Explore advanced concepts and best practices",
      descriptionTr: "İleri kavramları ve en iyi uygulamaları keşfedin"
    }
  ]
};

// Lesson templates for different module types
const lessonTemplates: Record<string, LessonData[]> = {
  foundations: [
    {
      titleEn: "Introduction and Overview",
      titleTr: "Giriş ve Genel Bakış",
      contentEn: "Learn the basic overview and history of the subject matter.",
      contentTr: "Konunun temel genel görünümünü ve tarihçesini öğrenin.",
      descriptionEn: "Getting started with the fundamentals",
      descriptionTr: "Temellerle başlamak",
      estimatedTime: 15
    },
    {
      titleEn: "Key Terminology",
      titleTr: "Temel Terminoloji",
      contentEn: "Understand the essential terms and vocabulary used in this field.",
      contentTr: "Bu alandaki gerekli terimleri ve kelime dağarcığını anlayın.",
      descriptionEn: "Learn the language of the subject",
      descriptionTr: "Konunun dilini öğrenin",
      estimatedTime: 20
    },
    {
      titleEn: "Fundamental Principles",
      titleTr: "Temel İlkeler",
      contentEn: "Master the foundational principles that underpin everything.",
      contentTr: "Her şeyin temelini oluşturan ilkeleri kavrayın.",
      descriptionEn: "Building blocks for deeper learning",
      descriptionTr: "Daha derin öğrenme için yapı taşları",
      estimatedTime: 25
    },
    {
      titleEn: "First Steps",
      titleTr: "İlk Adımlar",
      contentEn: "Take your first practical steps in this subject matter.",
      contentTr: "Bu konuda ilk pratik adımlarınızı atın.",
      descriptionEn: "Hands-on introduction",
      descriptionTr: "Uygulamalı giriş",
      estimatedTime: 20
    }
  ],
  core: [
    {
      titleEn: "Core Concept 1: Theory",
      titleTr: "Çekirdek Kavram 1: Teori",
      contentEn: "Understand the theoretical foundations and frameworks.",
      contentTr: "Teorik temelleri ve çerçeveleri anlayın.",
      descriptionEn: "Theoretical understanding",
      descriptionTr: "Teorik anlayış",
      estimatedTime: 30
    },
    {
      titleEn: "Core Concept 2: Analysis",
      titleTr: "Çekirdek Kavram 2: Analiz",
      contentEn: "Learn how to analyze and break down complex ideas.",
      contentTr: "Karmaşık fikirleri nasıl analiz edeceğinizi öğrenin.",
      descriptionEn: "Critical analysis skills",
      descriptionTr: "Kritik analiz becerileri",
      estimatedTime: 25
    },
    {
      titleEn: "Interconnections",
      titleTr: "Bağlantılar",
      contentEn: "See how different concepts relate and connect to each other.",
      contentTr: "Farklı kavramların birbirlerine nasıl bağlandığını görün.",
      descriptionEn: "Understanding relationships",
      descriptionTr: "İlişkileri anlama",
      estimatedTime: 20
    },
    {
      titleEn: "Common Misconceptions",
      titleTr: "Yaygın Yanılgılar",
      contentEn: "Avoid common mistakes and clarify confusing areas.",
      contentTr: "Yaygın hataları önleyin ve kafa karışıklığını açıklayın.",
      descriptionEn: "Avoiding pitfalls",
      descriptionTr: "Tuzaklardan kaçınma",
      estimatedTime: 15
    },
    {
      titleEn: "Deep Dive",
      titleTr: "Derinlemesine İnceleme",
      contentEn: "Explore one concept in great detail.",
      contentTr: "Bir kavramı ayrıntılarıyla keşfedin.",
      descriptionEn: "Comprehensive exploration",
      descriptionTr: "Kapsamlı inceleme",
      estimatedTime: 35
    }
  ],
  practical: [
    {
      titleEn: "Real-World Example 1",
      titleTr: "Gerçek Dünya Örneği 1",
      contentEn: "See a concrete example of how this is applied in practice.",
      contentTr: "Bunun pratikte nasıl uygulandığını somut bir örnekle görün.",
      descriptionEn: "Practical case study",
      descriptionTr: "Pratik vaka incelemesi",
      estimatedTime: 20
    },
    {
      titleEn: "Step-by-Step Guide",
      titleTr: "Adım Adım Rehber",
      contentEn: "Follow a detailed guide to implement these concepts.",
      contentTr: "Bu kavramları uygulamak için adım adım rehberi takip edin.",
      descriptionEn: "Implementation walkthrough",
      descriptionTr: "Uygulama kılavuzu",
      estimatedTime: 30
    },
    {
      titleEn: "Best Practices",
      titleTr: "En İyi Uygulamalar",
      contentEn: "Learn the best practices and industry standards.",
      contentTr: "En iyi uygulamaları ve endüstri standartlarını öğrenin.",
      descriptionEn: "Professional standards",
      descriptionTr: "Profesyonel standartlar",
      estimatedTime: 25
    },
    {
      titleEn: "Hands-On Exercise",
      titleTr: "Uygulamalı Egzersiz",
      contentEn: "Practice what you have learned with guided exercises.",
      contentTr: "Öğrendiklerinizi rehberli egzersizlerle pratik yapın.",
      descriptionEn: "Interactive practice",
      descriptionTr: "Etkileşimli pratik",
      estimatedTime: 35
    }
  ],
  advanced: [
    {
      titleEn: "Advanced Techniques",
      titleTr: "İleri Teknikler",
      contentEn: "Master advanced techniques used by professionals.",
      contentTr: "Profesyonellerin kullandığı ileri teknikleri öğrenin.",
      descriptionEn: "Professional-level techniques",
      descriptionTr: "Profesyonel seviye teknikler",
      estimatedTime: 40
    },
    {
      titleEn: "Optimization Strategies",
      titleTr: "Optimizasyon Stratejileri",
      contentEn: "Learn how to optimize for performance and efficiency.",
      contentTr: "Performans ve verimlilik için nasıl optimize edeceğinizi öğrenin.",
      descriptionEn: "Performance tuning",
      descriptionTr: "Performans ayarlaması",
      estimatedTime: 35
    },
    {
      titleEn: "Problem Solving",
      titleTr: "Problem Çözme",
      contentEn: "Develop critical problem-solving skills for complex scenarios.",
      contentTr: "Karmaşık senaryolar için problem çözme becerilerini geliştirin.",
      descriptionEn: "Advanced problem solving",
      descriptionTr: "İleri problem çözme",
      estimatedTime: 30
    },
    {
      titleEn: "Case Study Analysis",
      titleTr: "Vaka Analizi",
      contentEn: "Analyze real-world case studies and solutions.",
      contentTr: "Gerçek dünya vaka örneklerini ve çözümlerini analiz edin.",
      descriptionEn: "Real scenario analysis",
      descriptionTr: "Gerçek senaryo analizi",
      estimatedTime: 25
    }
  ]
};

export async function seedModulesAndLessons() {
  try {
    console.log("Checking for existing modules...");
    
    // Check if we already have modules
    const existingModules = await db.select().from(modules);
    
    if (existingModules.length > 0) {
      console.log(`Modules already exist (${existingModules.length} found), skipping seed.`);
      return;
    }
    
    console.log("Seeding modules and lessons...");
    
    // Fetch all courses
    const allCourses = await db.select().from(courses);
    
    if (allCourses.length === 0) {
      console.log("No courses found to seed modules for.");
      return;
    }
    
    let moduleCount = 0;
    let lessonCount = 0;
    
    // For each course, create modules and lessons
    for (const course of allCourses) {
      const courseModuleTemplates = moduleTemplates.default;
      
      // Create modules for this course
      for (let i = 0; i < courseModuleTemplates.length; i++) {
        const moduleTemplate = courseModuleTemplates[i];
        
        // Insert module
        const insertedModule = await db
          .insert(modules)
          .values({
            courseId: course.id,
            title: moduleTemplate.titleEn, // Legacy field
            description: moduleTemplate.descriptionEn, // Legacy field
            titleEn: moduleTemplate.titleEn,
            titleTr: moduleTemplate.titleTr,
            descriptionEn: moduleTemplate.descriptionEn,
            descriptionTr: moduleTemplate.descriptionTr,
            order: i
          })
          .returning({ id: modules.id });
        
        if (insertedModule.length === 0) continue;
        
        const moduleId = insertedModule[0].id;
        moduleCount++;
        
        // Determine which lesson templates to use based on module order
        let lessonTemplatesForModule: LessonData[] = [];
        if (i === 0) {
          lessonTemplatesForModule = lessonTemplates.foundations;
        } else if (i === 1) {
          lessonTemplatesForModule = lessonTemplates.core;
        } else if (i === 2) {
          lessonTemplatesForModule = lessonTemplates.practical;
        } else {
          lessonTemplatesForModule = lessonTemplates.advanced;
        }
        
        // Create lessons for this module
        for (let j = 0; j < lessonTemplatesForModule.length; j++) {
          const lessonTemplate = lessonTemplatesForModule[j];
          const wordCount = (lessonTemplate.contentEn.split(/\s+/).length + 
                            lessonTemplate.contentTr.split(/\s+/).length) / 2;
          
          await db
            .insert(lessons)
            .values({
              moduleId: moduleId,
              title: lessonTemplate.titleEn, // Legacy field
              content: lessonTemplate.contentEn, // Legacy field
              titleEn: lessonTemplate.titleEn,
              titleTr: lessonTemplate.titleTr,
              contentEn: lessonTemplate.contentEn,
              contentTr: lessonTemplate.contentTr,
              descriptionEn: lessonTemplate.descriptionEn,
              descriptionTr: lessonTemplate.descriptionTr,
              order: j,
              estimatedTime: lessonTemplate.estimatedTime,
              tags: ["educational", course.category?.toLowerCase() || "general"]
            });
          
          lessonCount++;
        }
      }
    }
    
    console.log(`✓ Seeding complete: Created ${moduleCount} modules and ${lessonCount} lessons for ${allCourses.length} courses`);
  } catch (error) {
    console.error("Error seeding modules and lessons:", error);
  }
}
