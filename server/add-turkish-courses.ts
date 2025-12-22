import { storage } from "./storage.js";

/**
 * Adds Turkish university entrance exam (YKS) courses to the database
 */
async function addTurkishCourses() {
  try {
    console.log("Adding Turkish university entrance exam (YKS) courses...");
    
    // Get the instructor user
    let instructorId = 1;
    const instructorUser = await storage.getUserByUsername("instructor");
    
    if (instructorUser) {
      instructorId = instructorUser.id;
    }
    
    // TYT Courses (First stage of YKS)
    
    const tytMath = await storage.createCourse({
      title: "TYT Matematik – TYT Mathematics",
      description: "YKS TYT matematik konularının tümünü kapsayan kapsamlı kurs: temel matematik, cebir, geometri ve problem çözme teknikleri. Comprehensive course covering all TYT mathematics topics including basic math, algebra, geometry, and problem-solving techniques required for the Turkish university entrance exam.",
      category: "Turkish YKS - TYT",
      moduleCount: 12,
      durationHours: 36,
      instructorId,
      level: "Advanced",
      imageUrl: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80",
      rating: 5
    });
    
    const tytTurkish = await storage.createCourse({
      title: "TYT Türkçe – TYT Turkish Language",
      description: "TYT sınavı için Türkçe dil bilgisi, anlama ve edebiyat konularında ustalaşma kursu. Master Turkish language grammar, comprehension, and literature for the TYT exam with this comprehensive course designed by expert instructors.",
      category: "Turkish YKS - TYT",
      moduleCount: 10,
      durationHours: 30,
      instructorId,
      level: "Intermediate",
      imageUrl: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80",
      rating: 5
    });
    
    const tytScience = await storage.createCourse({
      title: "TYT Temel Bilimler – TYT Basic Sciences",
      description: "TYT fen bilimleri bölümü için fizik, kimya ve biyoloji temellerini kapsayan tam hazırlık kursu. Complete preparation for TYT science sections covering physics, chemistry, and biology fundamentals with practice tests and solved examples.",
      category: "Turkish YKS - TYT",
      moduleCount: 15,
      durationHours: 40,
      instructorId,
      level: "Intermediate",
      imageUrl: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80",
      rating: 5
    });
    
    const tytSocial = await storage.createCourse({
      title: "TYT Sosyal Bilimler – TYT Social Sciences",
      description: "TYT sınavı için tarih, coğrafya, felsefe ve din-etik konularının kapsamlı işlenmesi. Comprehensive coverage of history, geography, philosophy, and religion & ethics topics for the TYT exam with practice questions.",
      category: "Turkish YKS - TYT",
      moduleCount: 8,
      durationHours: 24,
      instructorId,
      level: "Intermediate",
      imageUrl: "https://images.unsplash.com/photo-1447069387593-a5de0862481e?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80",
      rating: 5
    });
    
    // AYT Courses (Second stage of YKS)
    
    const aytMath = await storage.createCourse({
      title: "AYT Advanced Mathematics",
      description: "In-depth course covering advanced mathematics topics for the AYT exam including calculus, functions, statistics and probability.",
      category: "Turkish YKS - AYT",
      moduleCount: 14,
      durationHours: 42,
      instructorId,
      level: "Advanced",
      imageUrl: "https://images.unsplash.com/photo-1509228468518-180dd4864904?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80",
      rating: 5
    });
    
    const aytPhysics = await storage.createCourse({
      title: "AYT Physics",
      description: "Comprehensive physics course covering mechanics, electricity, magnetism, waves, optics and modern physics for the AYT exam.",
      category: "Turkish YKS - AYT",
      moduleCount: 10,
      durationHours: 32,
      instructorId,
      level: "Advanced",
      imageUrl: "https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80",
      rating: 5
    });
    
    const aytChemistry = await storage.createCourse({
      title: "AYT Chemistry",
      description: "Expert-led chemistry course for AYT covering organic chemistry, reactions, periodic table, chemical bonds and laboratory experiments.",
      category: "Turkish YKS - AYT",
      moduleCount: 8,
      durationHours: 28,
      instructorId,
      level: "Advanced",
      imageUrl: "https://images.unsplash.com/photo-1603126857599-f6e157fa2fe6?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80",
      rating: 5
    });
    
    const aytBiology = await storage.createCourse({
      title: "AYT Biology",
      description: "Comprehensive biology course covering cells, genetics, human physiology, ecology and evolution concepts for the AYT exam.",
      category: "Turkish YKS - AYT",
      moduleCount: 8,
      durationHours: 26,
      instructorId,
      level: "Advanced",
      imageUrl: "https://images.unsplash.com/photo-1530026405186-ed1f139313f8?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80",
      rating: 5
    });
    
    const aytLiterature = await storage.createCourse({
      title: "AYT Turkish Literature",
      description: "In-depth course on Turkish literature covering important literary periods, authors, works and critical analysis for the AYT exam.",
      category: "Turkish YKS - AYT",
      moduleCount: 9,
      durationHours: 30,
      instructorId,
      level: "Advanced",
      imageUrl: "https://images.unsplash.com/photo-1519682337058-a94d519337bc?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80",
      rating: 5
    });
    
    const aytHistory = await storage.createCourse({
      title: "AYT History",
      description: "Comprehensive history course covering Ottoman Empire, Turkish Republic history and modern world history for the AYT exam.",
      category: "Turkish YKS - AYT",
      moduleCount: 10,
      durationHours: 32,
      instructorId,
      level: "Advanced",
      imageUrl: "https://images.unsplash.com/photo-1461360228754-6e81c478b882?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80",
      rating: 5
    });
    
    // YDT (Foreign Language Test) Course
    
    const ydtEnglish = await storage.createCourse({
      title: "YDT English",
      description: "Complete preparation for the English language portion of the YKS exam covering grammar, reading comprehension, vocabulary and test strategies.",
      category: "Turkish YKS - YDT",
      moduleCount: 12,
      durationHours: 36,
      instructorId,
      level: "Intermediate",
      imageUrl: "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80",
      rating: 5
    });
    
    // YKS Preparation Courses
    
    const testStrategies = await storage.createCourse({
      title: "YKS Test-Taking Strategies",
      description: "Master essential test-taking techniques, time management skills, and problem-solving approaches specifically designed for the YKS exam.",
      category: "Turkish YKS - Preparation",
      moduleCount: 6,
      durationHours: 18,
      instructorId,
      level: "Intermediate",
      imageUrl: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80",
      rating: 5
    });
    
    const mockExams = await storage.createCourse({
      title: "YKS Mock Examinations",
      description: "Full-length practice tests simulating the actual YKS exam conditions with detailed solutions and performance analytics.",
      category: "Turkish YKS - Preparation",
      moduleCount: 8,
      durationHours: 24,
      instructorId,
      level: "Advanced",
      imageUrl: "https://images.unsplash.com/photo-1593642532400-2682810df593?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80",
      rating: 5
    });
    
    // Add sample assignments
    await storage.createAssignment({
      title: "TYT Math Practice Test",
      description: "Comprehensive practice test covering all TYT math topics",
      courseId: tytMath.id,
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // Two weeks from now
    });
    
    await storage.createAssignment({
      title: "AYT Physics Problem Set",
      description: "Advanced physics problems similar to those on the AYT exam",
      courseId: aytPhysics.id,
      dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000) // Ten days from now
    });
    
    await storage.createAssignment({
      title: "YKS Mock Exam 1",
      description: "Full-length YKS practice test under timed conditions",
      courseId: mockExams.id,
      dueDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000) // Three weeks from now
    });
    
    console.log("Successfully added Turkish university entrance exam courses!");
    return true;
  } catch (error) {
    console.error("Error adding Turkish courses:", error);
    return false;
  }
}

// Export the function for the API to use
export default addTurkishCourses;