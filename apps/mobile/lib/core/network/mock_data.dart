import 'models.dart';
// Re-export domain models so existing feature imports remain unchanged.
export 'models.dart' hide AuthResponse, HealthResponse;

class MockData {
  const MockData._();

  static final categories = <Category>[
    const Category(
      id: 'cat-1',
      name: 'Diet & Nutrition',
      slug: 'diet-nutrition',
      description: 'Fuel your body with wholesome, nutrient-dense foods.',
    ),
    const Category(
      id: 'cat-2',
      name: 'Fitness & Movement',
      slug: 'fitness-movement',
      description: 'Strengthen your heart and body through daily exercise.',
    ),
    const Category(
      id: 'cat-3',
      name: 'Mental Wellness',
      slug: 'mental-wellness',
      description: 'Calm your mind, improve focus, and develop resilience.',
    ),
    const Category(
      id: 'cat-4',
      name: 'Sleep & Recovery',
      slug: 'sleep-recovery',
      description: 'Optimize your rest periods to promote cell repair.',
    ),
    const Category(
      id: 'cat-5',
      name: 'Break Bad Habits',
      slug: 'break-bad-habits',
      description: 'Overcome self-limiting habits and mindless scrolling.',
    ),
    const Category(
      id: 'cat-6',
      name: 'Family Wellness',
      slug: 'family-wellness',
      description: 'Connect with loved ones and establish group habits.',
    ),
  ];

  static final challenges = <Challenge>[
    // Category 1: Diet & Nutrition
    const Challenge(
      id: 'ch-1',
      title: 'No Refined Sugar',
      slug: 'no-refined-sugar',
      shortDescription:
          'Cut out all processed sugars and artificial sweeteners.',
      description:
          'Remove refined sugars from your meals, snacks, and beverages. Focus on getting clean, sustained energy from whole food sources like fruits, complex carbohydrates, and wholesome fats.',
      durationDays: 30,
      difficulty: 'EASY',
      categoryId: 'cat-1',
      dailyTask: 'Avoid all added and refined sugars in food and beverages.',
      benefits: [
        'Better energy levels throughout the day',
        'Improved skin clarity and health',
        'Reduced full-body systemic inflammation',
        'Restored taste bud sensitivity to natural sweetness'
      ],
      safetyNote:
          'Consult a medical provider first if you are managing insulin resistance or diabetic conditions.',
      isPopular: true,
      isRecommended: true,
    ),
    const Challenge(
      id: 'ch-2',
      title: 'Hydration Target',
      slug: 'hydration-target',
      shortDescription: 'Drink 3 liters of pure water daily.',
      description:
          'Consistently drink 3 liters of pure, unflavored water throughout the day. Hydrating properly supports cellular function, speeds muscle recovery, and keeps cognitive performance sharp.',
      durationDays: 30,
      difficulty: 'BEGINNER',
      categoryId: 'cat-1',
      dailyTask: 'Drink a minimum of 3 liters of pure water.',
      benefits: [
        'Improved natural digestion and detoxification',
        'Enhanced mental focus and concentration',
        'Better joint lubrication and less muscle stiffness'
      ],
      safetyNote:
          'Do not attempt to drink excessive quantities in short windows to avoid hyponatremia.',
    ),

    // Category 2: Fitness & Movement
    const Challenge(
      id: 'ch-3',
      title: '30-Minute Outdoor Walk',
      slug: '30-min-walk',
      shortDescription: 'Walk at least 30 minutes in nature.',
      description:
          'Get moving outside. A daily 30-minute walk at a brisk pace boosts cardiorespiratory health, decreases cortisol levels, and delivers fresh air and natural sunlight.',
      durationDays: 30,
      difficulty: 'BEGINNER',
      categoryId: 'cat-2',
      dailyTask: 'Walk outdoors continuously for 30 minutes.',
      benefits: [
        'Stronger heart health and cardiovascular stamina',
        'Reduced daily stress and anxiety',
        'Better circadian rhythm alignment due to sunlight exposure'
      ],
      safetyNote: '',
      isPopular: true,
      isRecommended: true,
    ),
    const Challenge(
      id: 'ch-4',
      title: 'Bodyweight Strength',
      slug: 'bodyweight-strength',
      shortDescription: 'Perform 3 basic bodyweight strength sets.',
      description:
          'Build functional strength at home. Complete 3 sets of standard push-ups, bodyweight squats, and a 60-second forearm plank every day.',
      durationDays: 30,
      difficulty: 'MEDIUM',
      categoryId: 'cat-2',
      dailyTask: 'Complete 3 rounds of push-ups, squats, and a 1-minute plank.',
      benefits: [
        'Increased core strength and posture stability',
        'Toned muscles and joint skeletal protection',
        'Higher daily metabolic rate'
      ],
      safetyNote: '',
    ),

    // Category 3: Mental Wellness
    const Challenge(
      id: 'ch-5',
      title: '10-Minute Mindfulness Meditation',
      slug: '10-min-meditation',
      shortDescription: 'Practice mindful breathing for 10 minutes.',
      description:
          'Train your brain to rest. Sit quietly for 10 minutes, focusing completely on the physical sensation of your breath. Gently redirect your focus whenever thoughts wander.',
      durationDays: 30,
      difficulty: 'BEGINNER',
      categoryId: 'cat-3',
      dailyTask: 'Sit in quiet mindfulness meditation for 10 minutes.',
      benefits: [
        'Substantially lowered daily stress and anxiety',
        'Increased emotional regulation and patience',
        'Better focus and decreased mind-wandering'
      ],
      safetyNote: '',
      isPopular: true,
    ),
    const Challenge(
      id: 'ch-6',
      title: 'Gratitude Journaling',
      slug: 'gratitude-journal',
      shortDescription: 'Write down 3 specific things you are grateful for.',
      description:
          'Cultivate positivity. Every morning or evening, write down three specific, detailed things in your life that you are genuinely thankful for.',
      durationDays: 30,
      difficulty: 'EASY',
      categoryId: 'cat-3',
      dailyTask: 'Log three specific points of gratitude in your journal.',
      benefits: [
        'Rewired focus towards positive life details',
        'Higher baseline satisfaction and mood levels',
        'Improved sleep quality when done at night'
      ],
      safetyNote: '',
      isRecommended: true,
    ),

    // Category 4: Sleep & Recovery
    const Challenge(
      id: 'ch-7',
      title: 'Screen-Free Wind Down',
      slug: 'screen-free-wind-down',
      shortDescription: 'Turn off all screens 1 hour before sleeping.',
      description:
          'Protect your natural melatonin production. Disconnect completely from phones, tablets, laptops, and televisions one full hour before going to bed. Use this time to read or stretch.',
      durationDays: 30,
      difficulty: 'EASY',
      categoryId: 'cat-4',
      dailyTask: 'Commit to zero screen time for 60 minutes before bedtime.',
      benefits: [
        'Faster sleep onset without tossing and turning',
        'Deeper, uninterrupted slow-wave sleep cycles',
        'Reduced waking fatigue and mental fog'
      ],
      safetyNote: '',
      isPopular: true,
      isRecommended: true,
    ),

    // Category 5: Break Bad Habits
    const Challenge(
      id: 'ch-8',
      title: 'Mindful Scrolling Limit',
      slug: 'mindful-scrolling-limit',
      shortDescription: 'Limit social media scrolling to 15 minutes.',
      description:
          'Stop the dopamine loop. Cap your total daily social media consumption across all platforms to exactly 15 minutes. Use system timers to stay compliant.',
      durationDays: 30,
      difficulty: 'HARD',
      categoryId: 'cat-5',
      dailyTask: 'Spend less than 15 minutes total on social media platforms.',
      benefits: [
        'Reclaimed hours of productive time daily',
        'Reduced feelings of comparative inadequacy',
        'Lowered cognitive clutter and sensory overload'
      ],
      safetyNote: '',
      isPopular: true,
    ),

    // Category 6: Family Wellness
    const Challenge(
      id: 'ch-9',
      title: 'Screen-Free Family Meal',
      slug: 'screen-free-family-meal',
      shortDescription: 'Share a screen-free dinner with loved ones.',
      description:
          'Establish connection. Keep all mobile phones, screens, and work completely away from the dining table. Focus 100% on active listening and shared conversation.',
      durationDays: 30,
      difficulty: 'BEGINNER',
      categoryId: 'cat-6',
      dailyTask: 'Eat at least one meal with family/friends with zero devices.',
      benefits: [
        'Strengthened interpersonal bonds and empathy',
        'Slower, more mindful eating and better digestion',
        'Higher quality face-to-face communication'
      ],
      safetyNote: '',
    ),
  ];
}
