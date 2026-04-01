<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\TrainingModule;
use App\Models\TrainingSection;
use App\Models\TrainingChecklist;
use App\Models\TrainingQuiz;

class TrainingModuleSeeder extends Seeder
{
    public function run(): void
    {
        $this->seedDashboard();
        $this->seedCampaigns();
        $this->seedCustomers();
        $this->seedRewards();
        $this->seedReports();
        $this->seedWhatsAppEwards();
    }

    // ─── Module 1: Dashboard Overview ───────────────────────────────────

    private function seedDashboard(): void
    {
        $mod = TrainingModule::create([
            'title'         => 'Dashboard Overview',
            'slug'          => 'dashboard',
            'description'   => 'Understand your eWards home screen — key metrics, customer counts, and activity feed.',
            'icon'          => '📊',
            'display_order' => 1,
            'points_reward'      => 50,
            'estimated_minutes'  => 5,
            'quiz_enabled'       => true,
            'certificate_enabled'=> true,
            'is_published'       => true,
            'page_route'         => '/dashboard',
        ]);

        // Quiz metadata
        \App\Models\QuizMetadata::create(['module_id' => $mod->id, 'title' => 'Dashboard Quiz', 'passing_percent' => 75, 'is_active' => true]);

        // Sections
        TrainingSection::create([
            'module_id'     => $mod->id,
            'title'         => 'What is the Dashboard?',
            'content_type'  => 'text',
            'body'          => "The Dashboard is your home screen in eWards. It shows key metrics at a glance — total customers, active campaigns, recent transactions, and reward redemptions. Think of it as your daily health check for the loyalty program.\n\nEvery time you log in, start here. It tells you what is working and what needs attention.",
            'display_order' => 1,
            'key_takeaway'  => 'The dashboard is your daily starting point — it shows key loyalty program metrics at a glance so you know what is working and what needs attention.',
        ]);

        TrainingSection::create([
            'module_id'     => $mod->id,
            'title'         => "Do's and Don'ts",
            'content_type'  => 'text',
            'body'          => "**Do:**\n- Check the dashboard daily for anomalies\n- Use date range filters to compare periods\n- Look at trends, not just absolute numbers\n\n**Don't:**\n- Ignore sudden drops in customer activity\n- Confuse \"total customers\" with \"active customers\"\n- Make decisions based on a single day's data",
            'display_order' => 2,
            'key_takeaway'  => 'Always check the dashboard daily with proper date filters, and focus on trends rather than single-day numbers.',
        ]);

        TrainingSection::create([
            'module_id'     => $mod->id,
            'title'         => 'Common Mistakes',
            'content_type'  => 'text',
            'body'          => "- **Confusing total vs active customers** — Total includes everyone who ever signed up. Active means customers who transacted recently.\n- **Not filtering by date range** — Always set the date range before reading any metrics.\n- **Ignoring the activity feed** — The recent transactions section shows real-time data that can reveal issues faster than summary metrics.",
            'display_order' => 3,
            'key_takeaway'  => 'Avoid confusing total with active customers, always filter by date range, and pay attention to the real-time activity feed.',
        ]);

        // Checklist
        $checklists = [
            ['label' => 'Locate the key metrics panel', 'display_order' => 1],
            ['label' => 'Understand active vs total customers', 'display_order' => 2],
            ['label' => 'Read the recent transactions feed', 'display_order' => 3],
            ['label' => 'Check campaign performance summary', 'display_order' => 4],
            ['label' => 'Use date range filters', 'display_order' => 5],
        ];
        foreach ($checklists as $item) {
            TrainingChecklist::create(array_merge($item, ['module_id' => $mod->id]));
        }

        // Quiz
        $quizzes = [
            [
                'question'       => 'What is the first thing you should check when you log into eWards?',
                'options'        => ['Campaign settings', 'Dashboard metrics', 'Customer list', 'Report exports'],
                'correct_answer' => 'Dashboard metrics',
                'display_order'  => 1,
            ],
            [
                'question'       => 'What is the difference between "total customers" and "active customers"?',
                'options'        => ['They are the same thing', 'Total includes everyone who signed up; active means recently transacted', 'Active includes everyone; total is filtered', 'Total is for today; active is for the month'],
                'correct_answer' => 'Total includes everyone who signed up; active means recently transacted',
                'display_order'  => 2,
            ],
            [
                'question'       => 'Why should you always use date range filters before reading metrics?',
                'options'        => ['To make the page load faster', 'Raw numbers without date context are misleading', 'It is required by the system', 'To export the data correctly'],
                'correct_answer' => 'Raw numbers without date context are misleading',
                'display_order'  => 3,
            ],
            [
                'question'       => 'How often should you check the dashboard for anomalies?',
                'options'        => ['Weekly', 'Monthly', 'Daily', 'Only when there is a problem'],
                'correct_answer' => 'Daily',
                'display_order'  => 4,
            ],
        ];
        foreach ($quizzes as $q) {
            TrainingQuiz::create(array_merge($q, ['module_id' => $mod->id]));
        }
    }

    // ─── Module 2: Campaign Creation ────────────────────────────────────

    private function seedCampaigns(): void
    {
        $mod = TrainingModule::create([
            'title'         => 'Campaign Creation',
            'slug'          => 'campaigns',
            'description'   => 'Learn to create targeted SMS, WhatsApp, and push notification campaigns.',
            'icon'          => '📢',
            'display_order' => 2,
            'points_reward'      => 50,
            'estimated_minutes'  => 8,
            'quiz_enabled'       => true,
            'certificate_enabled'=> true,
            'is_published'       => true,
            'page_route'         => '/campaigns',
        ]);
        \App\Models\QuizMetadata::create(['module_id' => $mod->id, 'title' => 'Campaign Quiz', 'passing_percent' => 75, 'is_active' => true]);

        // Sections
        TrainingSection::create([
            'module_id'     => $mod->id,
            'title'         => 'How Campaigns Work',
            'content_type'  => 'text',
            'body'          => "Campaigns let you send targeted offers to your customers. You can create SMS, WhatsApp, or push notification campaigns with audience segmentation.\n\nThe flow is simple: choose your audience, write your message, attach a reward or offer, set a schedule, and send. Every campaign is tracked so you can see opens, clicks, and redemptions.",
            'display_order' => 1,
            'key_takeaway'  => 'Campaigns follow a simple flow — choose audience, write message, attach reward, schedule, and send — with full tracking of results.',
        ]);

        TrainingSection::create([
            'module_id'     => $mod->id,
            'title'         => "Do's and Don'ts",
            'content_type'  => 'text',
            'body'          => "**Do:**\n- Define a clear target audience before creating\n- Always preview your message before sending\n- Set an end date for every campaign\n- A/B test with a small audience first\n\n**Don't:**\n- Send campaigns without an end date\n- Target \"all customers\" when a segment would be better\n- Send more than 2 campaigns per week to the same audience\n- Forget to check the reward is active before linking it",
            'display_order' => 2,
            'key_takeaway'  => 'Always preview messages, set end dates, segment your audience, and limit campaigns to 2 per week per audience.',
        ]);

        TrainingSection::create([
            'module_id'     => $mod->id,
            'title'         => 'Common Mistakes',
            'content_type'  => 'text',
            'body'          => "- **Targeting \"all customers\"** — This leads to low engagement. Always segment by activity, location, or purchase history.\n- **No preview before sending** — Typos in campaign messages damage brand trust. Always preview.\n- **Missing end date** — Campaigns without end dates run forever, draining your reward budget.\n- **Wrong timing** — Sending campaigns at 2 AM gets you unsubscribes, not sales.",
            'display_order' => 3,
            'key_takeaway'  => 'Segment your audience instead of blasting everyone, always preview for typos, and never forget to set an end date.',
        ]);

        // Checklist
        $checklists = [
            ['label' => 'Understand campaign types (SMS, WhatsApp, Push)', 'display_order' => 1],
            ['label' => 'Select target audience segment', 'display_order' => 2],
            ['label' => 'Configure reward or offer', 'display_order' => 3],
            ['label' => 'Review campaign settings and preview', 'display_order' => 4],
            ['label' => 'Submit or schedule the campaign', 'display_order' => 5],
        ];
        foreach ($checklists as $item) {
            TrainingChecklist::create(array_merge($item, ['module_id' => $mod->id]));
        }

        // Quiz
        $quizzes = [
            [
                'question'       => 'What should you always do before sending a campaign?',
                'options'        => ['Send it to all customers', 'Preview the message', 'Delete old campaigns', 'Change the reward amount'],
                'correct_answer' => 'Preview the message',
                'display_order'  => 1,
            ],
            [
                'question'       => 'Why should you avoid targeting "all customers"?',
                'options'        => ['It costs more money', 'It leads to low engagement; segmenting is better', 'The system does not allow it', 'It takes too long to send'],
                'correct_answer' => 'It leads to low engagement; segmenting is better',
                'display_order'  => 2,
            ],
            [
                'question'       => 'What happens if you forget to set an end date on a campaign?',
                'options'        => ['Nothing, it auto-expires', 'The campaign runs forever, draining your reward budget', 'The system rejects it', 'It sends only once'],
                'correct_answer' => 'The campaign runs forever, draining your reward budget',
                'display_order'  => 3,
            ],
            [
                'question'       => 'What is the recommended maximum number of campaigns per week to the same audience?',
                'options'        => ['1', '2', '5', '10'],
                'correct_answer' => '2',
                'display_order'  => 4,
            ],
        ];
        foreach ($quizzes as $q) {
            TrainingQuiz::create(array_merge($q, ['module_id' => $mod->id]));
        }
    }

    // ─── Module 3: Customer Upload ──────────────────────────────────────

    private function seedCustomers(): void
    {
        $mod = TrainingModule::create([
            'title'         => 'Customer Upload',
            'slug'          => 'customers',
            'description'   => 'Import your existing customer database into eWards via CSV or manual entry.',
            'icon'          => '👥',
            'display_order' => 3,
            'points_reward'      => 50,
            'estimated_minutes'  => 7,
            'quiz_enabled'       => true,
            'certificate_enabled'=> true,
            'is_published'       => true,
            'page_route'         => '/customers',
        ]);
        \App\Models\QuizMetadata::create(['module_id' => $mod->id, 'title' => 'Customer Upload Quiz', 'passing_percent' => 75, 'is_active' => true]);

        // Sections
        TrainingSection::create([
            'module_id'     => $mod->id,
            'title'         => 'Importing Customers',
            'content_type'  => 'text',
            'body'          => "The Customers page lets you import your existing customer database into eWards via CSV upload or manual entry. This is how you onboard your loyalty base.\n\nYour CSV must include: customer name, phone number, and email (optional). Once uploaded, customers are automatically enrolled in your loyalty program and can start earning points.",
            'display_order' => 1,
            'key_takeaway'  => 'Import customers via CSV (name, phone required, email optional) to enroll them in the loyalty program automatically.',
        ]);

        TrainingSection::create([
            'module_id'     => $mod->id,
            'title'         => "Do's and Don'ts",
            'content_type'  => 'text',
            'body'          => "**Do:**\n- Validate phone numbers before upload (10 digits, correct country code)\n- De-duplicate your list before importing\n- Start with a small test batch (50–100 records) first\n- Check the error log after every import\n\n**Don't:**\n- Upload duplicate records — they create confusion\n- Ignore the required column headers\n- Upload without checking phone number format\n- Import inactive or very old customer data",
            'display_order' => 2,
            'key_takeaway'  => 'Validate phone numbers, de-duplicate your list, test with a small batch first, and always check error logs after import.',
        ]);

        TrainingSection::create([
            'module_id'     => $mod->id,
            'title'         => 'Common Mistakes',
            'content_type'  => 'text',
            'body'          => "- **Wrong column headers** — The CSV must have exact column names: Name, Phone, Email. Mismatched headers cause the entire import to fail.\n- **Duplicate phone numbers** — Two customers with the same phone number create data conflicts. Always de-duplicate first.\n- **Invalid phone formats** — Missing country code or extra spaces will cause rows to be skipped.\n- **Not checking error logs** — After import, always review failed entries to fix and re-upload them.",
            'display_order' => 3,
            'key_takeaway'  => 'Use exact column headers (Name, Phone, Email), remove duplicates, fix phone formats, and review error logs after every import.',
        ]);

        // Checklist
        $checklists = [
            ['label' => 'Understand required customer fields', 'display_order' => 1],
            ['label' => 'Prepare CSV in correct format', 'display_order' => 2],
            ['label' => 'Validate phone numbers and emails', 'display_order' => 3],
            ['label' => 'Upload and verify import results', 'display_order' => 4],
            ['label' => 'Review error logs for failed entries', 'display_order' => 5],
        ];
        foreach ($checklists as $item) {
            TrainingChecklist::create(array_merge($item, ['module_id' => $mod->id]));
        }

        // Quiz
        $quizzes = [
            [
                'question'       => 'What are the required fields for a customer CSV upload?',
                'options'        => ['Name, Address, Age', 'Name, Phone, Email (optional)', 'Phone, Password, Role', 'Email, Phone, Date of Birth'],
                'correct_answer' => 'Name, Phone, Email (optional)',
                'display_order'  => 1,
            ],
            [
                'question'       => 'What should you do before uploading a large customer list?',
                'options'        => ['Upload everything at once', 'Start with a small test batch of 50-100 records', 'Delete all existing customers first', 'Convert to PDF format'],
                'correct_answer' => 'Start with a small test batch of 50-100 records',
                'display_order'  => 2,
            ],
            [
                'question'       => 'What happens if you upload duplicate phone numbers?',
                'options'        => ['The system merges them automatically', 'They create data conflicts', 'Only the latest one is kept', 'The upload fails completely'],
                'correct_answer' => 'They create data conflicts',
                'display_order'  => 3,
            ],
            [
                'question'       => 'What should you always check after an import?',
                'options'        => ['The dashboard metrics', 'The error logs for failed entries', 'Campaign settings', 'User permissions'],
                'correct_answer' => 'The error logs for failed entries',
                'display_order'  => 4,
            ],
        ];
        foreach ($quizzes as $q) {
            TrainingQuiz::create(array_merge($q, ['module_id' => $mod->id]));
        }
    }

    // ─── Module 4: Coupon & Reward Setup ────────────────────────────────

    private function seedRewards(): void
    {
        $mod = TrainingModule::create([
            'title'         => 'Coupon & Reward Setup',
            'slug'          => 'rewards',
            'description'   => 'Configure point-based rewards, discounts, coupons, and free items.',
            'icon'          => '🎁',
            'display_order' => 4,
            'points_reward'      => 50,
            'estimated_minutes'  => 8,
            'quiz_enabled'       => true,
            'certificate_enabled'=> true,
            'is_published'       => true,
            'page_route'         => '/rewards',
        ]);
        \App\Models\QuizMetadata::create(['module_id' => $mod->id, 'title' => 'Rewards Quiz', 'passing_percent' => 75, 'is_active' => true]);

        // Sections
        TrainingSection::create([
            'module_id'     => $mod->id,
            'title'         => 'Setting Up Rewards',
            'content_type'  => 'text',
            'body'          => "Rewards and coupons are the core of your loyalty program. You can configure:\n\n- **Points-based rewards** — Customers earn points per purchase, redeem for discounts\n- **Flat discounts** — Fixed amount off (e.g., Rs.100 off)\n- **Percentage coupons** — Percentage off (e.g., 20% off)\n- **Free items** — Earn enough points, get a free item\n\nEvery reward needs an expiry date and redemption rules. Keep rewards simple and attractive — if customers can't understand the offer in 5 seconds, it won't work.",
            'display_order' => 1,
            'key_takeaway'  => 'Keep rewards simple — points, flat discounts, percentage coupons, or free items — always with expiry dates and clear redemption rules.',
        ]);

        TrainingSection::create([
            'module_id'     => $mod->id,
            'title'         => "Do's and Don'ts",
            'content_type'  => 'text',
            'body'          => "**Do:**\n- Set expiry dates on all coupons\n- Keep reward thresholds achievable (not too high)\n- Test the coupon redemption flow before going live\n- Create seasonal rewards tied to festivals or events\n\n**Don't:**\n- Create overlapping rewards that confuse customers\n- Set point thresholds so high that customers lose motivation\n- Forget to deactivate expired rewards\n- Make redemption rules too complicated",
            'display_order' => 2,
            'key_takeaway'  => 'Set achievable thresholds, always add expiry dates, test redemption before going live, and avoid overlapping offers.',
        ]);

        TrainingSection::create([
            'module_id'     => $mod->id,
            'title'         => 'Common Mistakes',
            'content_type'  => 'text',
            'body'          => "- **Threshold too high** — If it takes 50 visits to earn a free coffee, nobody will bother. Keep it achievable (5–10 visits).\n- **No expiry date** — Rewards without expiry accumulate liability. Always set a 30–90 day expiry.\n- **Overlapping offers** — Two active coupons for the same product confuse both customers and staff.\n- **Not testing** — Always redeem a test coupon yourself before publishing. Broken redemption = angry customers.",
            'display_order' => 3,
            'key_takeaway'  => 'Keep thresholds at 5-10 visits, set 30-90 day expiry, avoid overlapping offers, and always test redemption before publishing.',
        ]);

        // Checklist
        $checklists = [
            ['label' => 'Understand reward types (points, coupons, free items)', 'display_order' => 1],
            ['label' => 'Create a basic points-based reward', 'display_order' => 2],
            ['label' => 'Set up a coupon with an expiry date', 'display_order' => 3],
            ['label' => 'Configure redemption rules', 'display_order' => 4],
            ['label' => 'Test the reward flow end-to-end', 'display_order' => 5],
        ];
        foreach ($checklists as $item) {
            TrainingChecklist::create(array_merge($item, ['module_id' => $mod->id]));
        }

        // Quiz
        $quizzes = [
            [
                'question'       => 'Why must every coupon have an expiry date?',
                'options'        => ['To confuse customers', 'Rewards without expiry accumulate liability', 'The system requires it', 'To make reports easier'],
                'correct_answer' => 'Rewards without expiry accumulate liability',
                'display_order'  => 1,
            ],
            [
                'question'       => 'What is a common mistake with reward point thresholds?',
                'options'        => ['Setting them too low', 'Setting them too high so customers lose motivation', 'Making them free', 'Changing them weekly'],
                'correct_answer' => 'Setting them too high so customers lose motivation',
                'display_order'  => 2,
            ],
            [
                'question'       => 'What should you always do before publishing a coupon?',
                'options'        => ['Share it on social media', 'Test the redemption flow yourself', 'Send it to all customers', 'Delete old coupons'],
                'correct_answer' => 'Test the redemption flow yourself',
                'display_order'  => 3,
            ],
            [
                'question'       => 'What is the recommended expiry period for coupons?',
                'options'        => ['1 week', '30-90 days', '1 year', 'No expiry needed'],
                'correct_answer' => '30-90 days',
                'display_order'  => 4,
            ],
        ];
        foreach ($quizzes as $q) {
            TrainingQuiz::create(array_merge($q, ['module_id' => $mod->id]));
        }
    }

    // ─── Module 5: Reports Basics ───────────────────────────────────────

    private function seedReports(): void
    {
        $mod = TrainingModule::create([
            'title'         => 'Reports Basics',
            'slug'          => 'reports',
            'description'   => 'Read campaign performance, customer activity, redemption rates, and ROI.',
            'icon'          => '📈',
            'display_order' => 5,
            'points_reward'      => 50,
            'estimated_minutes'  => 6,
            'quiz_enabled'       => true,
            'certificate_enabled'=> true,
            'is_published'       => true,
            'page_route'         => '/reports',
        ]);
        \App\Models\QuizMetadata::create(['module_id' => $mod->id, 'title' => 'Reports Quiz', 'passing_percent' => 75, 'is_active' => true]);

        // Sections
        TrainingSection::create([
            'module_id'     => $mod->id,
            'title'         => 'Understanding Reports',
            'content_type'  => 'text',
            'body'          => "Reports give you insights into campaign performance, customer activity, redemption rates, and ROI. This is where data turns into decisions.\n\nKey metrics to track:\n- **Redemption rate** — What % of issued coupons were actually used?\n- **Customer engagement** — How many customers transacted this week vs last?\n- **Campaign ROI** — Did the campaign revenue exceed the discount cost?\n- **Repeat visit rate** — Are customers coming back?",
            'display_order' => 1,
            'key_takeaway'  => 'Reports turn data into decisions — focus on redemption rate, customer engagement, campaign ROI, and repeat visit rate.',
        ]);

        TrainingSection::create([
            'module_id'     => $mod->id,
            'title'         => "Do's and Don'ts",
            'content_type'  => 'text',
            'body'          => "**Do:**\n- Export reports weekly for team review\n- Compare same-length periods (week vs week, month vs month)\n- Look at redemption rate, not just total sends\n- Drill down into segment-level data\n\n**Don't:**\n- Compare weekdays with weekends without adjusting\n- Focus on vanity metrics (total sends) instead of actionable ones (redemptions)\n- Ignore seasonal patterns when comparing months\n- Make decisions based on less than 2 weeks of data",
            'display_order' => 2,
            'key_takeaway'  => 'Export weekly, compare equal periods, focus on redemption over sends, and drill into segment-level data.',
        ]);

        TrainingSection::create([
            'module_id'     => $mod->id,
            'title'         => 'Common Mistakes',
            'content_type'  => 'text',
            'body'          => "- **Vanity metrics** — \"We sent 10,000 messages\" means nothing if only 50 were redeemed. Focus on conversion.\n- **No date filtering** — Raw numbers without date context are misleading. Always filter.\n- **Ignoring segments** — Overall numbers hide important patterns. A campaign might work great for new customers but fail for regulars.\n- **Not acting on insights** — Reports are useless if nobody reads them. Set a weekly 15-minute review habit.",
            'display_order' => 3,
            'key_takeaway'  => 'Focus on conversion not vanity metrics, always filter by date, check segment-level patterns, and act on insights weekly.',
        ]);

        // Checklist
        $checklists = [
            ['label' => 'Navigate to the Reports section', 'display_order' => 1],
            ['label' => 'Understand key metrics (redemption rate, ROI, engagement)', 'display_order' => 2],
            ['label' => 'Filter reports by date range and campaign', 'display_order' => 3],
            ['label' => 'Export a report as CSV or PDF', 'display_order' => 4],
            ['label' => 'Identify one actionable insight from the data', 'display_order' => 5],
        ];
        foreach ($checklists as $item) {
            TrainingChecklist::create(array_merge($item, ['module_id' => $mod->id]));
        }

        // Quiz
        $quizzes = [
            [
                'question'       => 'What metric should you focus on instead of "total sends"?',
                'options'        => ['Total customers', 'Redemption rate', 'Number of campaigns', 'Login count'],
                'correct_answer' => 'Redemption rate',
                'display_order'  => 1,
            ],
            [
                'question'       => 'Why should you avoid comparing weekdays with weekends?',
                'options'        => ['The system does not allow it', 'Traffic patterns differ, making comparisons misleading', 'Weekends have no data', 'It is against company policy'],
                'correct_answer' => 'Traffic patterns differ, making comparisons misleading',
                'display_order'  => 2,
            ],
            [
                'question'       => 'How often should you review reports with your team?',
                'options'        => ['Daily', 'Weekly', 'Monthly', 'Only when there is a problem'],
                'correct_answer' => 'Weekly',
                'display_order'  => 3,
            ],
            [
                'question'       => 'What is the biggest mistake people make with reports?',
                'options'        => ['Exporting too often', 'Not acting on insights — reports are useless if nobody reads them', 'Looking at too many metrics', 'Filtering by date'],
                'correct_answer' => 'Not acting on insights — reports are useless if nobody reads them',
                'display_order'  => 4,
            ],
        ];
        foreach ($quizzes as $q) {
            TrainingQuiz::create(array_merge($q, ['module_id' => $mod->id]));
        }
    }

    // ─── Module 6: eWards Instant Pass ──────────────────────────────────

    private function seedWhatsAppEwards(): void
    {
        $mod = TrainingModule::create([
            'title'         => 'eWards Instant Pass',
            'slug'          => 'whatsapp-ewards',
            'description'   => 'OTP scanner, coupon listing, member enrollment, points check, and session tracking — all via WhatsApp.',
            'icon'          => '📲',
            'display_order' => 6,
            'points_reward'      => 50,
            'estimated_minutes'  => 10,
            'quiz_enabled'       => true,
            'certificate_enabled'=> true,
            'is_published'       => true,
            'page_route'         => '/training/whatsapp-ewards',
        ]);
        \App\Models\QuizMetadata::create(['module_id' => $mod->id, 'title' => 'eWards Instant Pass Quiz', 'passing_percent' => 75, 'is_active' => true]);

        // Sections
        TrainingSection::create([
            'module_id'     => $mod->id,
            'title'         => 'eWards Instant Pass — Complete Overview',
            'content_type'  => 'text',
            'body'          => "Customers can access their loyalty features by simply messaging the brand on WhatsApp. No app download needed, no store visit required.\n\n**How It Works:**\n- Customer scans a QR code at the store (billing counter, standee, or receipt)\n- WhatsApp opens automatically with the brand's number\n- Customer sends a message and gets an instant response\n\n**What Customers Can Do:**\n- **Hi / Hello** — Opens a welcome menu with all options\n- **OTP** — Gets their latest OTP instantly (members only)\n- **Points** — Checks their loyalty points balance (members only)\n- **Coupon / Promo / Deal / Offer** — Views up to 5 active coupons, sorted by soonest expiry\n- **Join** — New customers can enroll as members (reply YES to confirm)\n- Commands work in any case — \"otp\", \"OTP\", \"Otp\" all work the same\n- If someone types something unrecognised, they get a helpful guide message\n\n**Coupon Listing:**\n- The bot shows up to 5 active coupons sorted by soonest expiry\n- If a customer has more than 5 coupons, a \"View All\" link opens the full list\n- Only valid, active coupons are shown — expired or fully used ones are automatically hidden\n\n**Add Member (Join Without Forms):**\n- Non-members type \"Join\" and reply \"YES\" to confirm\n- Membership is created instantly — no forms, no app needed\n- Important: Welcome offers or joining rewards are NOT automatically given through WhatsApp enrollment\n- The customer has 10 minutes to reply \"YES\" — after that, they need to type \"Join\" again",
            'display_order' => 1,
            'key_takeaway'  => 'Customers can check OTP, points, coupons, and enroll via WhatsApp by scanning a QR code — no app download needed.',
        ]);

        TrainingSection::create([
            'module_id'     => $mod->id,
            'title'         => "Do's and Don'ts",
            'content_type'  => 'text',
            'body'          => "**Do:**\n- Place QR codes at billing counter AND store entrance where customers can easily see them\n- Guide customers: \"Ma'am, scan this QR to get your OTP on WhatsApp\"\n- Try the OTP and coupon flow yourself before telling customers about it\n- Tell customers at billing that they can check their coupons on WhatsApp anytime\n- Encourage non-members to type \"Join\" — it takes just 10 seconds to enroll\n- If a customer has multiple brands, make sure they message the correct brand's WhatsApp number\n- Always check that the QR code is scanning correctly before busy hours\n\n**Don't:**\n- Hide the QR code where customers cannot find it\n- Assume customers know how to scan QR codes — always offer to help first-time users\n- Tell customers they can create a new OTP on WhatsApp — WhatsApp only shows the existing OTP, it cannot create a new one\n- Promise welcome rewards or joining benefits to customers who enroll via WhatsApp — these are not given through this channel\n- Tell customers all their coupons will show — only valid, non-expired coupons appear",
            'display_order' => 2,
            'key_takeaway'  => 'Place QR codes visibly, guide customers through their first scan, and never promise welcome rewards for WhatsApp enrollment.',
        ]);

        TrainingSection::create([
            'module_id'     => $mod->id,
            'title'         => 'Common Mistakes',
            'content_type'  => 'text',
            'body'          => "- **WhatsApp not working for a store** — If customers are not getting replies, ask your admin or support team to check the WhatsApp setup for that store. Do not try to fix it yourself.\n- **Promising welcome rewards on WhatsApp enrollment** — Customers who join via WhatsApp do NOT get welcome rewards or joining benefits automatically. This is the most common mistake staff make. Always set the right expectation.\n- **Customer says their coupons are missing** — Only valid, non-expired coupons are shown. If a coupon has been fully used or has expired, it will not appear. This is normal, not a bug.\n- **Join flow timeout** — After typing \"Join\", the customer has 10 minutes to reply \"YES\". If they wait too long, they need to type \"Join\" again. Remind them to reply quickly.\n- **Customer not getting a reply** — If the customer sends a message and does not get a reply, ask them to try again. If it still does not work, report it to your admin or support team.",
            'display_order' => 3,
            'key_takeaway'  => 'Never promise welcome rewards for WhatsApp enrollment, explain that only valid coupons appear, and escalate WhatsApp issues to admin.',
        ]);

        // Checklist
        $checklists = [
            ['label' => 'Know how customers scan the QR code and open WhatsApp', 'display_order' => 1],
            ['label' => 'Know what customers can type (Hi, OTP, Points, Coupon, Join)', 'display_order' => 2],
            ['label' => 'Know that only registered members can see OTP, Points, and Coupons', 'display_order' => 3],
            ['label' => 'Know how to guide a customer through their first scan', 'display_order' => 4],
            ['label' => 'Know the Join flow (type Join → reply YES → enrolled)', 'display_order' => 5],
            ['label' => 'Know that welcome rewards are NOT given via WhatsApp enrollment', 'display_order' => 6],
            ['label' => 'Know what to do if a customer is not getting a reply', 'display_order' => 7],
        ];
        foreach ($checklists as $item) {
            TrainingChecklist::create(array_merge($item, ['module_id' => $mod->id]));
        }

        // Quiz
        $quizzes = [
            [
                'question'       => 'What happens when a customer types "OTP" on WhatsApp?',
                'options'        => ['A new OTP is created for them', 'Their existing OTP is shown to them', 'They are asked to visit the store', 'Nothing happens'],
                'correct_answer' => 'Their existing OTP is shown to them',
                'display_order'  => 1,
            ],
            [
                'question'       => 'Can any phone number see OTP and Points on WhatsApp?',
                'options'        => ['Yes, anyone can see it', 'No — only registered members can see OTP, Points, and Coupons', 'Only if they have the app installed', 'Only during store hours'],
                'correct_answer' => 'No — only registered members can see OTP, Points, and Coupons',
                'display_order'  => 2,
            ],
            [
                'question'       => 'Can a customer create a new OTP using WhatsApp?',
                'options'        => ['Yes, by typing NEW OTP', 'Yes, by typing OTP twice', 'No — WhatsApp can only show an existing OTP, not create a new one', 'Yes, it is automatic'],
                'correct_answer' => 'No — WhatsApp can only show an existing OTP, not create a new one',
                'display_order'  => 3,
            ],
            [
                'question'       => 'How does a new customer join the loyalty program via WhatsApp?',
                'options'        => ['Download the app and register', 'Type "Join" then reply "YES" to confirm', 'Give their details to the cashier', 'Scan the QR code twice'],
                'correct_answer' => 'Type "Join" then reply "YES" to confirm',
                'display_order'  => 4,
            ],
            [
                'question'       => 'Do customers who join via WhatsApp get welcome rewards automatically?',
                'options'        => ['Yes, they get rewards instantly', 'Yes, after 24 hours', 'No — welcome rewards are not given through WhatsApp enrollment', 'Only if the store manager approves'],
                'correct_answer' => 'No — welcome rewards are not given through WhatsApp enrollment',
                'display_order'  => 5,
            ],
            [
                'question'       => 'How many coupons does the WhatsApp bot show at once?',
                'options'        => ['All coupons the customer has', 'Up to 5, sorted by soonest expiry, with a "View All" link for more', 'Only 1 at a time', 'Up to 10'],
                'correct_answer' => 'Up to 5, sorted by soonest expiry, with a "View All" link for more',
                'display_order'  => 6,
            ],
        ];
        foreach ($quizzes as $q) {
            TrainingQuiz::create(array_merge($q, ['module_id' => $mod->id]));
        }
    }
}
