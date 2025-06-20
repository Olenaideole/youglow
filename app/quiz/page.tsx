"use client"

import { useState, useEffect, Suspense } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Sparkles,
  ArrowLeft,
  ArrowRight,
  Star,
  CheckCircle,
  Clock,
  Shield,
  Users,
  Trophy,
  Mail,
  Target,
  Zap,
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useRouter, useSearchParams } from "next/navigation"
import { redirectToCheckout } from "@/lib/stripe-client";
import { toast } from "sonner"; // Adjust path if necessary, e.g. "@/components/ui/use-toast" and then const { toast } = useToast();

// Interface and Component for URL State Handling
interface QuizUrlStateHandlerProps {
  setShowResults: (value: boolean) => void;
  setAnswers: (value: Record<number, string | string[]>) => void;
  setEmail: (value: string) => void;
  setShowGame: (value: boolean) => void;
  setGameCompleted: (value: boolean) => void;
  setShowEmailCapture: (value: boolean) => void;
  setShowChallengeSetup: (value: boolean) => void;
  setIsInitializing: (value: boolean) => void;
  setCurrentQuestion: (value: number) => void;
}

function QuizUrlStateHandler(props: QuizUrlStateHandlerProps) {
  const searchParams = useSearchParams();

  useEffect(() => {
    const loadStateFromSession = () => {
      if (typeof window !== 'undefined') {
        try {
          const savedAnswers = sessionStorage.getItem('quizAnswers');
          if (savedAnswers) props.setAnswers(JSON.parse(savedAnswers));
          const savedEmail = sessionStorage.getItem('quizEmail');
          if (savedEmail) props.setEmail(savedEmail);
        } catch (e) {
          console.error("Error restoring quiz data from sessionStorage:", e);
        }
      }
    };

    props.setShowGame(false);
    props.setShowEmailCapture(false);
    props.setShowChallengeSetup(false);
    props.setShowResults(false);
    // props.setGameCompleted(false); // Handled per step explicitly

    const step = searchParams.get('step');

    switch (step) {
      case 'results':
        loadStateFromSession();
        props.setGameCompleted(true);
        props.setShowResults(true);
        props.setCurrentQuestion(quizQuestions.length - 1);
        break;
      case 'challenge':
        loadStateFromSession();
        props.setGameCompleted(true);
        props.setShowChallengeSetup(true);
        props.setCurrentQuestion(quizQuestions.length - 1);
        break;
      case 'email':
        loadStateFromSession();
        props.setGameCompleted(true);
        props.setShowEmailCapture(true);
        props.setCurrentQuestion(quizQuestions.length - 1);
        break;
      case 'game':
        loadStateFromSession();
        props.setShowGame(true);
        props.setGameCompleted(false);
        props.setCurrentQuestion(Math.floor(quizQuestions.length / 2));
        break;
      default:
        if (step && step.startsWith('question_')) {
          loadStateFromSession();
          const questionId = parseInt(step.split('_')[1], 10);
          const questionIndex = quizQuestions.findIndex(q => q.id === questionId);
          if (questionIndex !== -1) {
            props.setCurrentQuestion(questionIndex);
            if (questionIndex >= Math.floor(quizQuestions.length / 2)) {
              props.setGameCompleted(true); // Assume game is completed if navigating to or past game's natural position
            } else {
              props.setGameCompleted(false);
            }
          } else { // Invalid question_ID, fallback to first question
            if (typeof window !== 'undefined') {
              sessionStorage.removeItem('quizAnswers');
              sessionStorage.removeItem('quizEmail');
            }
            props.setAnswers({});
            props.setEmail('');
            props.setCurrentQuestion(0);
            props.setGameCompleted(false);
          }
        } else { // No step or unknown step (e.g., initial visit to /quiz)
          if (typeof window !== 'undefined') {
            sessionStorage.removeItem('quizAnswers');
            sessionStorage.removeItem('quizEmail');
          }
          props.setAnswers({});
          props.setEmail('');
          props.setCurrentQuestion(0);
          props.setGameCompleted(false);
        }
        break;
    }

    props.setIsInitializing(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, props.setAnswers, props.setEmail, props.setCurrentQuestion, props.setGameCompleted, props.setShowChallengeSetup, props.setShowEmailCapture, props.setShowGame, props.setShowResults, props.setIsInitializing]);

  return null;
}

export const dynamic = 'force-dynamic';

const quizQuestions = [
  // Demographics
  { id: 1, category: "Demographics", question: "What's your gender?", type: "radio", options: [ { value: "female", label: "Female" }, { value: "male", label: "Male" }, { value: "non_binary", label: "Non-binary" }, { value: "prefer_not_to_say", label: "Prefer not to say" }, ], }, { id: 2, category: "Demographics", question: "How old are you?", type: "radio", options: [ { value: "under_18", label: "Under 18" }, { value: "18_24", label: "18–24" }, { value: "25_34", label: "25–34" }, { value: "35_44", label: "35–44" }, { value: "45_54", label: "45–54" }, { value: "55_plus", label: "55+" }, ], },
  // Skin Goals & Type
  { id: 3, category: "Skin Goals & Type", question: "What's your #1 skin goal?", type: "radio", options: [ { value: "clear_acne", label: "Clear acne" }, { value: "even_tone", label: "Even out skin tone" }, { value: "reduce_lines", label: "Reduce fine lines & wrinkles" }, { value: "deep_hydration", label: "Deep hydration" }, { value: "boost_glow", label: "Boost natural glow" }, { value: "reduce_sensitivity", label: "Reduce sensitivity" }, ], }, { id: 4, category: "Skin Goals & Type", question: "How would you describe your skin type?", type: "radio", options: [ { value: "oily", label: "Oily" }, { value: "dry", label: "Dry" }, { value: "combination", label: "Combination" }, { value: "sensitive", label: "Sensitive" }, { value: "normal", label: "Normal" }, ], }, { id: 5, category: "Skin Goals & Type", question: "What skin concerns do you currently have? (Select all that apply)", type: "checkbox", options: [ { value: "acne", label: "Acne" }, { value: "pigmentation", label: "Pigmentation" }, { value: "dryness", label: "Dryness" }, { value: "wrinkles", label: "Wrinkles" }, { value: "dullness", label: "Dullness" }, { value: "sensitivity", label: "Sensitivity" }, { value: "none", label: "None" }, ], }, { id: 6, category: "Skin Goals & Type", question: "How often do you wear makeup?", type: "radio", options: [ { value: "daily", label: "Daily" }, { value: "occasionally", label: "Occasionally" }, { value: "rarely", label: "Rarely" }, { value: "never", label: "Never" }, ], },
  // Diet & Food Habits
  { id: 7, category: "Diet & Food Habits", question: "Are you currently following any diet?", type: "radio", options: [ { value: "keto", label: "Keto" }, { value: "vegan", label: "Vegan" }, { value: "vegetarian", label: "Vegetarian" }, { value: "paleo", label: "Paleo" }, { value: "none", label: "None" }, ], }, { id: 8, category: "Diet & Food Habits", question: "Have you tried any diet in the past? Which ones?", type: "checkbox", options: [ { value: "keto", label: "Keto" }, { value: "vegan", label: "Vegan" }, { value: "vegetarian", label: "Vegetarian" }, { value: "paleo", label: "Paleo" }, { value: "intermittent_fasting", label: "Intermittent Fasting" }, { value: "low_carb", label: "Low Carb" }, { value: "mediterranean", label: "Mediterranean" }, { value: "none", label: "None" }, ], }, { id: 9, category: "Diet & Food Habits", question: "What foods do you crave most often?", type: "radio", options: [ { value: "sweet", label: "Sweet foods (chocolate, candy, desserts)" }, { value: "salty", label: "Salty foods (chips, crackers, pretzels)" }, { value: "carbs", label: "Carbs (bread, pasta, rice)" }, { value: "dairy", label: "Dairy (cheese, ice cream, milk)" }, { value: "fried", label: "Fried foods" }, { value: "healthy", label: "Healthy foods (fruits, vegetables)" }, ], }, { id: 10, category: "Diet & Food Habits", question: "How many glasses of water do you drink daily?", type: "radio", options: [ { value: "less_than_3", label: "Less than 3" }, { value: "3_5", label: "3-5" }, { value: "6_8", label: "6-8" }, { value: "more_than_8", label: "More than 8" }, ], }, { id: 11, category: "Diet & Food Habits", question: "How often do you eat processed or fast food?", type: "radio", options: [ { value: "rarely", label: "Rarely" }, { value: "1_2_times", label: "1-2 times per week" }, { value: "3_5_times", label: "3-5 times per week" }, { value: "almost_daily", label: "Almost daily" }, ], }, { id: 12, category: "Diet & Food Habits", question: "Do you have any food allergies?", type: "checkbox", options: [ { value: "dairy", label: "Dairy" }, { value: "gluten", label: "Gluten" }, { value: "nuts", label: "Nuts" }, { value: "shellfish", label: "Shellfish" }, { value: "eggs", label: "Eggs" }, { value: "soy", label: "Soy" }, { value: "none", label: "None" }, ], }, { id: 13, category: "Diet & Food Habits", question: "Are there specific foods you avoid for skin reasons?", type: "checkbox", options: [ { value: "dairy", label: "Dairy" }, { value: "sugar", label: "Sugar" }, { value: "chocolate", label: "Chocolate" }, { value: "fried_foods", label: "Fried foods" }, { value: "spicy_foods", label: "Spicy foods" }, { value: "alcohol", label: "Alcohol" }, { value: "none", label: "None" }, ], }, { id: 14, category: "Diet & Food Habits", question: "What are your 3 favorite dishes?", type: "text", placeholder: "e.g., Pasta carbonara, Chicken tikka masala, Caesar salad", helpText: "We'll create skin-friendly recipes inspired by them!", },
  // Supplements & Routine
  { id: 15, category: "Supplements & Routine", question: "Are you taking any skin supplements?", type: "checkbox", options: [ { value: "collagen", label: "Collagen" }, { value: "biotin", label: "Biotin" }, { value: "vitamin_c", label: "Vitamin C" }, { value: "vitamin_e", label: "Vitamin E" }, { value: "omega_3", label: "Omega-3" }, { value: "zinc", label: "Zinc" }, { value: "probiotics", label: "Probiotics" }, { value: "none", label: "None" }, ], }, { id: 16, category: "Supplements & Routine", question: "How many skincare products do you currently use?", type: "radio", options: [ { value: "1_2", label: "1-2 products" }, { value: "3_5", label: "3-5 products" }, { value: "6_10", label: "6-10 products" }, { value: "more_than_10", label: "More than 10 products" }, ], }, { id: 17, category: "Supplements & Routine", question: "How consistent are you with your skincare routine?", type: "radio", options: [ { value: "daily", label: "Daily" }, { value: "3_5_times", label: "3–5 times a week" }, { value: "rarely", label: "Rarely" }, ], }, { id: 18, category: "Supplements & Routine", question: "Which skincare product can't you live without?", type: "radio", options: [ { value: "cleanser", label: "Cleanser" }, { value: "moisturizer", label: "Moisturizer" }, { value: "sunscreen", label: "Sunscreen" }, { value: "serum", label: "Serum" }, { value: "retinol", label: "Retinol" }, { value: "none", label: "None" }, ], },
  // Lifestyle
  { id: 19, category: "Lifestyle", question: "How many hours of sleep do you get per night?", type: "radio", options: [ { value: "less_than_5", label: "Less than 5 hours" }, { value: "5_6", label: "5-6 hours" }, { value: "7_8", label: "7-8 hours" }, { value: "more_than_8", label: "More than 8 hours" }, ], }, { id: 20, category: "Lifestyle", question: "How often do you work out?", type: "radio", options: [ { value: "daily", label: "Daily" }, { value: "3_5_times", label: "3-5 times per week" }, { value: "1_2_times", label: "1-2 times per week" }, { value: "rarely", label: "Rarely" }, { value: "never", label: "Never" }, ], }, { id: 21, category: "Lifestyle", question: "What's your stress level most days?", type: "radio", options: [ { value: "low", label: "Low" }, { value: "medium", label: "Medium" }, { value: "high", label: "High" }, ], },
  // Additional Questions
  { id: 22, category: "Lifestyle", question: "How much time do you spend in the sun daily?", type: "radio", options: [ { value: "minimal", label: "Minimal (mostly indoors)" }, { value: "moderate", label: "Moderate (30 min - 2 hours)" }, { value: "high", label: "High (more than 2 hours)" }, ], }, { id: 23, category: "Skin Goals & Type", question: "Do you have any skin conditions diagnosed by a dermatologist?", type: "checkbox", options: [ { value: "acne", label: "Acne" }, { value: "rosacea", label: "Rosacea" }, { value: "eczema", label: "Eczema" }, { value: "psoriasis", label: "Psoriasis" }, { value: "melasma", label: "Melasma" }, { value: "none", label: "None" }, ], }, { id: 24, category: "Lifestyle", question: "How often do you change your pillowcase?", type: "radio", options: [ { value: "daily", label: "Daily" }, { value: "every_few_days", label: "Every few days" }, { value: "weekly", label: "Weekly" }, { value: "rarely", label: "Rarely" }, ], }, { id: 25, category: "Diet & Food Habits", question: "Do you drink alcohol?", type: "radio", options: [ { value: "never", label: "Never" }, { value: "occasionally", label: "Occasionally (1-2 times per month)" }, { value: "weekly", label: "Weekly (1-3 times per week)" }, { value: "daily", label: "Daily" }, ], },
];

const ingredientsGame = {
  question: "Quick Game! Which of these ingredients is bad for your skin?",
  options: [ { value: "hyaluronic_acid", label: "Hyaluronic Acid", correct: false }, { value: "alcohol_denat", label: "Alcohol Denat", correct: true }, { value: "niacinamide", label: "Niacinamide", correct: false }, { value: "vitamin_c", label: "Vitamin C", correct: false }, { value: "retinol", label: "Retinol", correct: false }, ],
};

const testimonials = [ { name: "Sarah M.", beforeAfter: "90% acne reduction in 6 weeks", text: "The personalized plan actually worked! My skin has never been clearer.", rating: 5, image: "/placeholder.svg?height=60&width=60", }, { name: "Emma K.", beforeAfter: "Glowing skin transformation", text: "The food scanner helped me avoid products that were breaking me out. Game changer!", rating: 5, image: "/placeholder.svg?height=60&width=60", }, { name: "Jessica L.", beforeAfter: "Reduced fine lines in 8 weeks", text: "The recipes are delicious and my skin looks 5 years younger. Worth every penny!", rating: 5, image: "/placeholder.svg?height=60&width=60", }, { name: "Maria R.", beforeAfter: "Even skin tone achieved", text: "Finally found a solution that works for my sensitive skin. The AI coach is amazing!", rating: 5, image: "/placeholder.svg?height=60&width=60", }, ];

const liveRegistrations = [ "jenn**@gmail.com just joined", "mari**@yahoo.com just grabbed the deal", "alex**@outlook.com just started their plan", "sara**@icloud.com just joined", "emma**@gmail.com just grabbed the deal", "lisa**@yahoo.com just started their plan", ];

const plans = [ { id: "1-week", name: "1 Week", originalPrice: 17.77, discountedPrice: 6.93, perDay: 0.99, popular: false, }, { id: "4-weeks", name: "4 Weeks", originalPrice: 38.95, discountedPrice: 15.19, perDay: 0.54, popular: true, badge: "Most Popular", }, { id: "12-weeks", name: "12 Weeks", originalPrice: 89.72, discountedPrice: 34.99, perDay: 0.42, popular: false, badge: "Best Value", }, ];

export default function QuizPage() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string | string[]>>({});
  const [showGame, setShowGame] = useState(false);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [gameAnswer, setGameAnswer] = useState("");
  const [showEmailCapture, setShowEmailCapture] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState(""); // Added name state
  const [showChallengeSetup, setShowChallengeSetup] = useState(false);
  const [challengeData, setChallengeData] = useState({
    title: "",
    concern: "",
    improvement: 50,
    duration: 14,
    triedBefore: "",
    difficulties: "",
  });
  const [showResults, setShowResults] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [currentRegistration, setCurrentRegistration] = useState(0);
  const [earnedBadge, setEarnedBadge] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  // const [reportError, setReportError] = useState<string | null>(null);

  const router = useRouter();

  useEffect(() => {
    // Persist answers to sessionStorage whenever they change
    if (typeof window !== 'undefined' && Object.keys(answers).length > 0) { // Check if answers is not empty
      try {
        sessionStorage.setItem('quizAnswers', JSON.stringify(answers));
      } catch (e) {
        console.error("Error saving quiz answers to sessionStorage:", e);
      }
    } else if (typeof window !== 'undefined' && Object.keys(answers).length === 0) {
      // If answers becomes empty (e.g. reset), remove it from storage too
      sessionStorage.removeItem('quizAnswers');
    }
  }, [answers]);

  useEffect(() => {
    // Persist email to sessionStorage whenever it changes
    if (typeof window !== 'undefined' && email) { // Check if email is not empty
      try {
        sessionStorage.setItem('quizEmail', email);
      } catch (e) {
        console.error("Error saving quiz email to sessionStorage:", e);
      }
    } else if (typeof window !== 'undefined' && !email) {
       // If email becomes empty, remove it from storage
      sessionStorage.removeItem('quizEmail');
    }
  }, [email]);

  const totalSteps = quizQuestions.length + 4;

  let currentStep = 0;
  if (showResults) {
    currentStep = totalSteps;
  } else if (showChallengeSetup) {
    currentStep = quizQuestions.length + 3;
  } else if (showEmailCapture) {
    currentStep = quizQuestions.length + 2;
  } else if (showGame) {
    currentStep = Math.floor(quizQuestions.length / 2) + 1;
  } else if (gameCompleted) {
    currentStep = currentQuestion + 1;
    if (currentQuestion >= Math.floor(quizQuestions.length / 2)) {
      currentStep += 1;
    }
  } else {
    currentStep = currentQuestion + 1;
  }

  const progress = Math.min(100, Math.max(0, (currentStep / totalSteps) * 100));
  const shouldShowGame = currentQuestion >= Math.floor(quizQuestions.length / 2) && !gameCompleted;

  useEffect(() => {
    if (showResults && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [showResults, timeLeft]);

  useEffect(() => {
    if (showResults) {
      const interval = setInterval(() => {
        setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [showResults]);

  useEffect(() => {
    if (showResults) {
      const interval = setInterval(() => {
        setCurrentRegistration((prev) => (prev + 1) % liveRegistrations.length);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [showResults]);

  const handleAnswer = (value: string | string[]) => {
    setAnswers((prev) => ({ ...prev, [quizQuestions[currentQuestion].id]: value }));
  };

  const handleGameAnswer = (value: string) => {
    setGameAnswer(value);
    const correct = ingredientsGame.options.find((opt) => opt.value === value)?.correct;
    if (correct) {
      setEarnedBadge(true);
    }
    setTimeout(() => {
      setGameCompleted(true);
      setShowGame(false);
      // currentQuestion should be at Math.floor(quizQuestions.length / 2)
      // The question to show is quizQuestions[currentQuestion]
      router.push(`/quiz?step=question_${quizQuestions[currentQuestion].id}`, { shallow: true });
    }, 2000);
  };

  const nextQuestion = () => {
    if (shouldShowGame && !gameCompleted) {
      setShowGame(true);
      router.push("/quiz?step=game", { shallow: true });
      return;
    }
    if (currentQuestion < quizQuestions.length - 1) {
      const nextQIndex = currentQuestion + 1;
      setCurrentQuestion(nextQIndex); // Update state first
      router.push(`/quiz?step=question_${quizQuestions[nextQIndex].id}`, { shallow: true });
    } else {
      setShowEmailCapture(true); // Update state first
      router.push("/quiz?step=email", { shallow: true });
    }
  };

  const prevQuestion = () => {
    if (showChallengeSetup) { // Coming back from Challenge to Email
      setShowChallengeSetup(false);
      setShowEmailCapture(true);
      router.push("/quiz?step=email", { shallow: true });
      return;
    }
    if (showEmailCapture) { // Coming back from Email to last Question
      setShowEmailCapture(false);
      // currentQuestion should still be the last question index
      router.push(`/quiz?step=question_${quizQuestions[currentQuestion].id}`, { shallow: true });
      return;
    }
    // Handling navigation back from a question or from the game
    if (showGame) { // If currently on the game screen, going back to question before game
      setShowGame(false);
      // currentQuestion should be the index of the question *before* the game
      router.push(`/quiz?step=question_${quizQuestions[currentQuestion].id}`, { shallow: true });
      return;
    }

    if (currentQuestion > 0) {
      const prevQIndex = currentQuestion - 1;
      // Check if prevQIndex is the one just before where the game should be shown
      // The game is shown when currentQuestion is Math.floor(quizQuestions.length / 2).
      // So, the question *before* the game is at index Math.floor(quizQuestions.length / 2) - 1.
      const isPrevQuestionBeforeGame = prevQIndex === (Math.floor(quizQuestions.length / 2) - 1);

      if (gameCompleted && isPrevQuestionBeforeGame) {
        // If game was completed and we are navigating to the question right before the game,
        // the "previous" step logically is the game itself.
        setCurrentQuestion(prevQIndex); // setCurrentQuestion to the question *before* the game
        setShowGame(true); // Set showGame to true to indicate the game step
        router.push("/quiz?step=game", { shallow: true });
      } else {
        setCurrentQuestion(prevQIndex);
        router.push(`/quiz?step=question_${quizQuestions[prevQIndex].id}`, { shallow: true });
      }
    }
  };

  const handleEmailSubmit = async () => { // Make the function async
    if (!name || !email) return; // Added name check
    // setReportError(null); // Clear previous errors
    setIsGeneratingReport(true);

    try {
      const response = await fetch('/api/generate-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          answers: answers, // The existing 'answers' state
          email: email,     // The existing 'email' state
          name: name,       // Added name
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('Failed to generate report:', result.error, result.details);
        toast.error("Failed to Generate Report", { // MODIFIED
          description: `${result.details || result.error || 'An unknown error occurred. Please try again.'}`,
        });
      } else {
        console.log('Report generation initiated:', result.message);
        toast.success("Report Request Submitted!", { // ADDED
          description: "Your personalized skin report is being generated and will be sent to your email shortly.",
        });

        setShowEmailCapture(false);
        // setShowChallengeSetup(true); // State update handled by URL state handler if needed
        router.push("/quiz?step=challenge", { shallow: true });
        if (typeof window !== 'undefined') {
          try {
            sessionStorage.setItem('quizAnswers', JSON.stringify(answers));
            if (email) {
              sessionStorage.setItem('quizEmail', email);
            }
          } catch (e) {
            console.error("Error saving quiz data to sessionStorage:", e);
          }
        }
      }
    } catch (error) {
      console.error('Error submitting email for report generation:', error);
      toast.error("Network Error", { // MODIFIED
        description: "A network error occurred. Please check your connection and try again.",
      });
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const handleChallengeSubmit = () => {
    setShowChallengeSetup(false);
    setShowResults(true);
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem('quizAnswers', JSON.stringify(answers));
        if (email) {
          sessionStorage.setItem('quizEmail', email);
        }
      } catch (e) {
        console.error("Error saving quiz data to sessionStorage:", e);
      }
    }
    router.push('/quiz?step=results', { shallow: true });
  };

  const skipChallenge = () => {
    setShowChallengeSetup(false);
    setShowResults(true);
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem('quizAnswers', JSON.stringify(answers));
        if (email) {
          sessionStorage.setItem('quizEmail', email);
        }
      } catch (e) {
        console.error("Error saving quiz data to sessionStorage:", e);
      }
    }
    router.push('/quiz?step=results', { shallow: true });
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const getPersonalizedPlan = () => {
    const goal = answers[3];
    const skinType = answers[4];
    let planTitle = "Your Personalized Skin Glow Plan";
    let planDescription = "Customized for your unique skin needs";
    if (goal === "clear_acne") {
      planTitle = "Clear Skin Transformation Plan";
      planDescription = "Targeted acne-fighting nutrition and skincare routine";
    } else if (goal === "boost_glow") {
      planTitle = "Radiant Glow Enhancement Plan";
      planDescription = "Antioxidant-rich foods and glow-boosting strategies";
    } else if (goal === "reduce_lines") {
      planTitle = "Anti-Aging Renewal Plan";
      planDescription = "Collagen-supporting nutrition and age-defying routine";
    }
    return { planTitle, planDescription };
  };

  const renderQuizContent = () => {
    if (showGame) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 py-12">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto">
              <div className="text-center mb-8">
                <Link href="/" className="inline-flex items-center space-x-2 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-r from-pink-400 to-purple-500 rounded-full flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                    YouGlow
                  </span>
                </Link>
              </div>
              <div className="mb-8">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-600">{Math.round(progress)}% completed</span>
                  <Badge className="bg-yellow-100 text-yellow-800">🎮 Mini Game</Badge>
                </div>
                <Progress value={progress} className="h-3" />
              </div>
              <Card className="mb-8">
                <CardHeader className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Zap className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle className="text-2xl">{ingredientsGame.question}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-3">
                    {ingredientsGame.options.map((option) => (
                      <Button
                        key={option.value}
                        variant={gameAnswer === option.value ? (option.correct ? "default" : "destructive") : "outline"}
                        onClick={() => handleGameAnswer(option.value)}
                        disabled={!!gameAnswer}
                        className={`p-4 h-auto text-left justify-start ${
                          gameAnswer === option.value && option.correct ? "bg-green-600 hover:bg-green-700" : ""
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          {gameAnswer === option.value && (
                            <div className="flex-shrink-0">
                              {option.correct ? (
                                <CheckCircle className="w-5 h-5 text-white" />
                              ) : (
                                <span className="text-white">❌</span>
                              )}
                            </div>
                          )}
                          <span className="font-medium">{option.label}</span>
                        </div>
                      </Button>
                    ))}
                  </div>
                  {gameAnswer && (
                    <div className="mt-6 text-center">
                      {ingredientsGame.options.find((opt) => opt.value === gameAnswer)?.correct ? (
                        <div className="space-y-3">
                          <div className="text-green-600 font-bold text-lg">✅ Correct!</div>
                          <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-4">
                            <div className="flex items-center justify-center space-x-2">
                              <Trophy className="w-5 h-5 text-yellow-600" />
                              <span className="font-semibold text-yellow-800">Badge Unlocked: Ingredient Expert!</span>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600">
                            Alcohol Denat can be very drying and irritating to the skin, especially for sensitive skin
                            types.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="text-red-600 font-bold text-lg">Not quite right!</div>
                          <p className="text-sm text-gray-600">
                            The correct answer is Alcohol Denat - it can be very drying and irritating to the skin.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
          <div className="text-center mt-8 text-xs text-gray-500">
            <Link href="/legal/terms" className="hover:underline">Terms of Service</Link>
            <span className="mx-2">|</span>
            <Link href="/legal/privacy" className="hover:underline">Privacy Policy</Link>
          </div>
        </div>
      );
    }

    if (showEmailCapture) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 py-12">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto">
              <div className="text-center mb-8">
                <Link href="/" className="inline-flex items-center space-x-2 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-r from-pink-400 to-purple-500 rounded-full flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                    YouGlow
                  </span>
                </Link>
              </div>
              <div className="mb-8">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-600">{Math.round(progress)}% completed</span>
                  <Badge className="bg-blue-100 text-blue-800">📧 Almost Done</Badge>
                </div>
                <Progress value={progress} className="h-3" />
              </div>
              <Card className="mb-8">
                <CardHeader className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Mail className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle className="text-2xl">Where should we send your personalized skin report?</CardTitle>
                  <p className="text-gray-600 mt-2">
                    Get your free personal plan + before & after progress tracking via email
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <Input
                      type="text"
                      placeholder="Enter your name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="text-center text-lg p-4"
                      required
                    />
                    <Input
                      type="email"
                      placeholder="Enter your email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="text-center text-lg p-4"
                      required
                    />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                      <div className="p-4 bg-green-50 rounded-lg">
                        <CheckCircle className="w-6 h-6 text-green-600 mx-auto mb-2" />
                        <p className="text-sm font-medium">Personalized Plan</p>
                      </div>
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <Target className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                        <p className="text-sm font-medium">Progress Tracking</p>
                      </div>
                      <div className="p-4 bg-purple-50 rounded-lg">
                        <Sparkles className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                        <p className="text-sm font-medium">AI Recommendations</p>
                      </div>
                    </div>
                  </div>
                  <Button
                    onClick={handleEmailSubmit}
                    disabled={!name || !email || isGeneratingReport} // Disable if name or email is empty or report is generating
                    className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white py-4 text-lg"
                  >
                    {isGeneratingReport ? 'Generating Your Report...' : 'Get My Personalized Report'}
                  </Button>
                  {/* {reportError && (
                      <p className="text-red-500 text-center mt-2">{reportError}</p>
                  )} */}
                </CardContent>
              </Card>
              <div className="flex justify-between">
                <Button variant="outline" onClick={prevQuestion} className="flex items-center space-x-2">
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </Button>
              </div>
            </div>
          </div>
          <div className="text-center mt-8 text-xs text-gray-500">
            <Link href="/legal/terms" className="hover:underline">Terms of Service</Link>
            <span className="mx-2">|</span>
            <Link href="/legal/privacy" className="hover:underline">Privacy Policy</Link>
          </div>
        </div>
      );
    }

    if (showChallengeSetup) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 py-12">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto">
              <div className="text-center mb-8">
                <Link href="/" className="inline-flex items-center space-x-2 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-r from-pink-400 to-purple-500 rounded-full flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                    YouGlow
                  </span>
                </Link>
              </div>
              <div className="mb-8">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-600">{Math.round(progress)}% completed</span>
                  <Badge className="bg-purple-100 text-purple-800">🎯 Challenge Setup</Badge>
                </div>
                <Progress value={progress} className="h-3" />
              </div>
              <Card className="mb-8">
                <CardHeader className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Target className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle className="text-2xl">Want to commit to a skin challenge?</CardTitle>
                  <p className="text-gray-600 mt-2">Optional - you can skip this step</p>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="challenge-title">Challenge Title</Label>
                      <Input
                        id="challenge-title"
                        placeholder="e.g., My Clear Skin Journey"
                        value={challengeData.title}
                        onChange={(e) => setChallengeData((prev) => ({ ...prev, title: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label>Select skin concern:</Label>
                      <RadioGroup
                        value={challengeData.concern}
                        onValueChange={(value) => setChallengeData((prev) => ({ ...prev, concern: value }))}
                        className="grid grid-cols-2 gap-4 mt-2"
                      >
                        {["Acne", "Wrinkles", "Dryness", "Pigmentation", "Dullness"].map((concern) => (
                          <div key={concern} className="flex items-center space-x-2">
                            <RadioGroupItem value={concern.toLowerCase()} id={concern} />
                            <Label htmlFor={concern}>{concern}</Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </div>
                    <div>
                      <Label>Target Improvement: {challengeData.improvement}%</Label>
                      <input
                        type="range"
                        min="10"
                        max="90"
                        value={challengeData.improvement}
                        onChange={(e) =>
                          setChallengeData((prev) => ({ ...prev, improvement: Number.parseInt(e.target.value) }))
                        }
                        className="w-full mt-2"
                      />
                    </div>
                    <div>
                      <Label>Duration:</Label>
                      <RadioGroup
                        value={challengeData.duration.toString()}
                        onValueChange={(value) =>
                          setChallengeData((prev) => ({ ...prev, duration: Number.parseInt(value) }))
                        }
                        className="grid grid-cols-2 gap-4 mt-2"
                      >
                        {[7, 14, 21, 28].map((days) => (
                          <div key={days} className="flex items-center space-x-2">
                            <RadioGroupItem value={days.toString()} id={`days-${days}`} />
                            <Label htmlFor={`days-${days}`}>{days} days</Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </div>
                    <div>
                      <Label>Have you tried any food-related skin challenges before?</Label>
                      <RadioGroup
                        value={challengeData.triedBefore}
                        onValueChange={(value) => setChallengeData((prev) => ({ ...prev, triedBefore: value }))}
                        className="flex space-x-6 mt-2"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="yes" id="tried-yes" />
                          <Label htmlFor="tried-yes">Yes</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="no" id="tried-no" />
                          <Label htmlFor="tried-no">No</Label>
                        </div>
                      </RadioGroup>
                    </div>
                    {challengeData.triedBefore === "yes" && (
                      <div>
                        <Label htmlFor="difficulties">What made them difficult for you?</Label>
                        <Textarea
                          id="difficulties"
                          placeholder="e.g., Hard to stick to the diet, didn't see results fast enough..."
                          value={challengeData.difficulties}
                          onChange={(e) => setChallengeData((prev) => ({ ...prev, difficulties: e.target.value }))}
                          className="mt-2"
                        />
                      </div>
                    )}
                  </div>
                  <div className="flex space-x-4">
                    <Button
                      onClick={handleChallengeSubmit}
                      className="flex-1 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white"
                    >
                      Create My Challenge
                    </Button>
                    <Button variant="outline" onClick={skipChallenge} className="flex-1">
                      Skip Challenge
                    </Button>
                  </div>
                </CardContent>
              </Card>
              <div className="flex justify-between">
                <Button variant="outline" onClick={prevQuestion} className="flex items-center space-x-2">
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </Button>
              </div>
            </div>
          </div>
          <div className="text-center mt-8 text-xs text-gray-500">
            <Link href="/legal/terms" className="hover:underline">Terms of Service</Link>
            <span className="mx-2">|</span>
            <Link href="/legal/privacy" className="hover:underline">Privacy Policy</Link>
          </div>
        </div>
      );
    }

    if (showResults) {
      const { planTitle, planDescription } = getPersonalizedPlan();
      return (
        <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-8">
                <Link href="/" className="inline-flex items-center space-x-2 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-r from-pink-400 to-purple-500 rounded-full flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                    YouGlow
                  </span>
                </Link>
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Your Glow-Up Plan is Ready!</h1>
                <p className="text-lg text-gray-600">Personalized nutrition, skin care routines, and daily AI tips designed to get your skin looking its best.</p>
                {earnedBadge && (
                  <div className="mt-4 inline-flex items-center space-x-2 bg-yellow-100 text-yellow-800 px-4 py-2 rounded-full">
                    <Trophy className="w-5 h-5" />
                    <span className="font-semibold">Ingredient Expert Badge Earned!</span>
                  </div>
                )}
              </div>
              <div className="bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-2xl p-6 mb-8 text-center">
                <h2 className="text-2xl font-bold mb-2">Limited-Time Offer — 50% Off for 10 Minutes Only</h2>
                <p className="mb-4">Your personal glow plan is reserved for the next {formatTime(timeLeft)} minutes</p>
                <div className="flex items-center justify-center space-x-2 text-2xl font-bold mb-4">
                  <Clock className="w-6 h-6" />
                  <span>{formatTime(timeLeft)}</span>
                </div>
                <Button
                  onClick={() => document.getElementById("pricing-section")?.scrollIntoView({ behavior: "smooth" })}
                  className="bg-white text-red-600 hover:bg-gray-100 font-bold px-8 py-3 rounded-full text-lg shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  Get Now - 50% Off!
                </Button>
              </div>
              <Card className="mb-8 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
                <CardHeader className="text-center">
                  <div className="flex items-center justify-center space-x-2 mb-4">
                    <Star className="w-6 h-6 text-yellow-400 fill-current" />
                    <h2 className="text-2xl font-bold text-gray-900">Real Story: Monica's Glow-Up</h2>
                    <Star className="w-6 h-6 text-yellow-400 fill-current" />
                  </div>
                  <p className="text-lg font-semibold text-green-800 mb-4">
                    Before You Start — Check Out Monica's Results!
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-green-100">
                      <p className="text-gray-700 italic text-lg leading-relaxed">
                        "I've struggled with acne for years. I tried everything — creams, treatments, strict diets.
                        Nothing worked. Then I found YouGlow. After following my personalized skin-food plan and tips for
                        4 weeks, my skin cleared up like never before. I feel confident again!"
                      </p>
                      <p className="text-right text-green-600 font-semibold mt-4">— Monica</p>
                    </div>
                    <div className="text-center">
                      <h3 className="text-xl font-bold text-gray-900 mb-4">📸 Before & After Photos:</h3>
                      <p className="text-gray-600 mb-4">Monica's skin transformation after just 4 weeks!</p>
                      <div className="relative rounded-2xl overflow-hidden shadow-lg max-w-2xl mx-auto">
                        <Image
                          src="/images/monica-before-after.png"
                          alt="Monica's before and after skin transformation showing clear improvement in acne"
                          width={800}
                          height={400}
                          className="w-full h-auto"
                        />
                        <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                          BEFORE
                        </div>
                        <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                          AFTER
                        </div>
                      </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div className="flex items-center space-x-3">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                          <span className="font-medium">Acne-Free Glow</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                          <span className="font-medium">Custom skin-friendly recipes</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                          <span className="font-medium">Ingredient scanner to avoid hidden skin triggers</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                          <span className="font-medium">AI GlowBot for instant advice</span>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center space-x-3">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                          <span className="font-medium">Daily tips tailored to my skin type</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                          <span className="font-medium">Personal challenges to stay motivated</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-center bg-gradient-to-r from-green-100 to-emerald-100 rounded-xl p-6">
                      <p className="text-green-800 font-semibold text-lg mb-2">
                        Ready to get the same results as Monica?
                      </p>
                      <p className="text-green-700">Your personalized plan is waiting below! ⬇️</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle className="text-center text-2xl">✨ Features Included in Your Plan</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <Sparkles className="w-4 h-4 text-purple-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold">GlowBot AI Assistant</h3>
                          <p className="text-sm text-gray-600">Weekly personal check-ins, progress tips, and reminders</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center flex-shrink-0">
                          📸
                        </div>
                        <div>
                          <h3 className="font-semibold">Skin Analyzer</h3>
                          <p className="text-sm text-gray-600">
                            Upload skin photos and track real-time AI progress analytics
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                          🍲
                        </div>
                        <div>
                          <h3 className="font-semibold">Personalized Recipes</h3>
                          <p className="text-sm text-gray-600">
                            Skin-friendly food recommendations tailored to your goals
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                          🏷️
                        </div>
                        <div>
                          <h3 className="font-semibold">Food & Product Label Scanner</h3>
                          <p className="text-sm text-gray-600">
                            Snap a product label and get instant skin compatibility feedback
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                          🎯
                        </div>
                        <div>
                          <h3 className="font-semibold">Skin Challenges</h3>
                          <p className="text-sm text-gray-600">
                            Join weekly challenges to improve your skin health habits
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                          📊
                        </div>
                        <div>
                          <h3 className="font-semibold">Skin Health Dashboard</h3>
                          <p className="text-sm text-gray-600">
                            Visual tracking of your skin scores and lifestyle habits
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle className="text-center">🌟 What Our Customers Say</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center mb-6">
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 max-w-md mx-auto">
                      <Image
                        src={testimonials[currentTestimonial].image || "/placeholder.svg"}
                        alt={testimonials[currentTestimonial].name}
                        width={60}
                        height={60}
                        className="rounded-full mx-auto mb-4"
                      />
                      <div className="flex justify-center mb-2">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                        ))}
                      </div>
                      <p className="text-sm text-gray-700 mb-3">"{testimonials[currentTestimonial].text}"</p>
                      <p className="font-semibold text-gray-900">{testimonials[currentTestimonial].name}</p>
                      <p className="text-xs text-green-600 font-medium">
                        ✨ {testimonials[currentTestimonial].beforeAfter}
                      </p>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="inline-flex items-center space-x-2 bg-green-50 text-green-800 px-4 py-2 rounded-full text-sm">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span>{liveRegistrations[currentRegistration]}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card id="pricing-section" className="mb-8">
                <CardHeader>
                  <CardTitle className="text-center">Choose Your Glow Journey</CardTitle>
                  <div className="text-center">
                    <Badge className="bg-red-100 text-red-800">50% OFF - Limited Time</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-6">
                    {plans.map((plan, index) => (
                      <div
                        key={index}
                        className={`relative rounded-2xl border-2 p-6 ${
                          plan.popular
                            ? "border-pink-400 bg-gradient-to-br from-pink-50 to-purple-50 shadow-lg scale-105"
                            : "border-gray-200 bg-white hover:border-pink-200 hover:shadow-md"
                        } transition-all duration-300`}
                      >
                        {plan.badge && (
                          <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                            <div className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-semibold">
                              {plan.badge}
                            </div>
                          </div>
                        )}
                        <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">{plan.name}</h3>
                        <div className="text-center mb-6">
                          <div className="flex items-center justify-center space-x-2 mb-2">
                            <span className="text-3xl font-bold text-gray-900">${plan.discountedPrice}</span>
                            <span className="text-lg text-gray-500 line-through">${plan.originalPrice}</span>
                          </div>
                          <div className="text-sm text-pink-600 font-medium">${plan.perDay}/day</div>
                        </div>
                        <Button
                          onClick={() => redirectToCheckout(plan.id)}
                          className={`w-full py-3 rounded-full font-semibold text-base ${
                            plan.popular
                              ? "bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white shadow-lg"
                              : "bg-gray-900 hover:bg-gray-800 text-white"
                          }`}
                        >
                          {timeLeft > 0 ? `Offer Ends: ${formatTime(timeLeft)} - Get Now!` : "Get Your Plan Now!"}
                        </Button>
                      </div>
                    ))}
                  </div>
                  <div className="mt-8 text-center">
                    <div className="flex flex-wrap justify-center items-center gap-6 text-sm text-gray-600">
                      <div className="flex items-center space-x-2">
                        <Shield className="w-4 h-4 text-green-600" />
                        <span>30-day money-back guarantee</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span>No obligations. Cancel anytime.</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Users className="w-4 h-4 text-blue-600" />
                        <span>Join 50,000+ happy users</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
          <div className="text-center mt-8 text-xs text-gray-500">
            <Link href="/legal/terms" className="hover:underline">Terms of Service</Link>
            <span className="mx-2">|</span>
            <Link href="/legal/privacy" className="hover:underline">Privacy Policy</Link>
          </div>
        </div>
      );
    }

    const currentQ = quizQuestions[currentQuestion];
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <Link href="/" className="inline-flex items-center space-x-2 mb-6">
                <div className="w-10 h-10 bg-gradient-to-r from-pink-400 to-purple-500 rounded-full flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <span className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                  YouGlow
                </span>
              </Link>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">Let's Personalize Your Plan</h1>
              <p className="text-lg text-gray-600">Answer questions to get your custom skin glow strategy</p>
            </div>
            <div className="mb-8">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-600">{Math.round(progress)}% completed</span>
                <Badge className="bg-pink-100 text-pink-800">{currentQ.category}</Badge>
              </div>
              <Progress value={progress} className="h-3" />
            </div>
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="text-xl text-center">{currentQ.question}</CardTitle>
                {currentQ.helpText && (
                  <p className="text-center text-sm text-green-600 font-medium">{currentQ.helpText}</p>
                )}
              </CardHeader>
              <CardContent>
                {currentQ.type === "radio" && (
                  <RadioGroup
                    value={(answers[currentQ.id] as string) || ""}
                    onValueChange={handleAnswer}
                    className="space-y-4"
                  >
                    {currentQ.options?.map((option) => (
                      <Label
                        key={option.value}
                        htmlFor={option.value}
                        className="flex items-center space-x-3 p-4 rounded-lg border border-gray-200 hover:border-pink-300 hover:bg-pink-50 transition-all cursor-pointer w-full"
                      >
                        <RadioGroupItem value={option.value} id={option.value} />
                        <span className="flex-1 font-medium">{option.label}</span>
                      </Label>
                    ))}
                  </RadioGroup>
                )}
                {currentQ.type === "checkbox" && (
                  <div className="space-y-4">
                    {currentQ.options?.map((option) => (
                      <Label
                        key={option.value}
                        htmlFor={option.value}
                        className="flex items-center space-x-3 p-4 rounded-lg border border-gray-200 hover:border-pink-300 hover:bg-pink-50 transition-all cursor-pointer w-full"
                      >
                        <Checkbox
                          id={option.value}
                          checked={((answers[currentQ.id] as string[]) || []).includes(option.value)}
                          onCheckedChange={(checked) => {
                            const currentAnswers = (answers[currentQ.id] as string[]) || []
                            if (checked) {
                              handleAnswer([...currentAnswers, option.value])
                            } else {
                              handleAnswer(currentAnswers.filter((a) => a !== option.value))
                            }
                          }}
                        />
                        <span className="flex-1 font-medium">{option.label}</span>
                      </Label>
                    ))}
                  </div>
                )}
                {currentQ.type === "text" && (
                  <Textarea
                    placeholder={currentQ.placeholder}
                    value={(answers[currentQ.id] as string) || ""}
                    onChange={(e) => handleAnswer(e.target.value)}
                    className="min-h-[100px]"
                  />
                )}
              </CardContent>
            </Card>
            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={prevQuestion}
                disabled={currentQuestion === 0}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Previous</span>
              </Button>
              <Button
                onClick={nextQuestion}
                disabled={
                  !answers[currentQ.id] ||
                  (Array.isArray(answers[currentQ.id]) && (answers[currentQ.id] as string[]).length === 0)
                }
                className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white flex items-center space-x-2"
              >
                <span>{currentQuestion === quizQuestions.length - 1 ? "Continue" : "Next"}</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div className="text-center mt-8 text-xs text-gray-500">
            <Link href="/legal/terms" className="hover:underline">Terms of Service</Link>
            <span className="mx-2">|</span>
            <Link href="/legal/privacy" className="hover:underline">Privacy Policy</Link>
          </div>
        </div>
      </div>
    );
  };

  const quizUrlStateHandlerProps = {
    setShowResults,
    setAnswers,
    setEmail,
    setShowGame,
    setGameCompleted,
    setShowEmailCapture,
    setShowChallengeSetup,
    setIsInitializing,
    setCurrentQuestion,
  };

  return (
    <>
      <Suspense fallback={null}>
        <QuizUrlStateHandler {...quizUrlStateHandlerProps} />
      </Suspense>
      {isInitializing ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
          <div>Loading Quiz...</div>
        </div>
      ) : renderQuizContent()}
    </>
  );
}
