<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\TrainingModule;

class PrototypeConfigSeeder extends Seeder
{
    public function run(): void
    {
        $this->seedDashboardPrototype();
        $this->seedCampaignsPrototype();
        $this->seedCustomersPrototype();
        $this->seedRewardsPrototype();
        $this->seedReportsPrototype();
        $this->seedWhatsAppEwardsPrototype();
    }

    // ─── Module 1: Dashboard Overview ───────────────────────────────────

    private function seedDashboardPrototype(): void
    {
        TrainingModule::where('slug', 'dashboard')->update(['prototype_config' => [
            'enabled' => true,
            'title' => 'Practice: Dashboard Navigation',
            'description' => 'Walk through the eWards dashboard and practice key actions',
            'points_reward' => 30,
            'flows' => [
                [
                    'id' => 'locate_key_metrics',
                    'title' => 'Locate Key Metrics',
                    'description' => 'Find the total customers and revenue on the dashboard',
                    'steps' => [
                        ['id' => 's1', 'type' => 'instruction', 'content' => 'Welcome! Let\'s explore the eWards dashboard together.'],
                        ['id' => 's2', 'type' => 'action', 'content' => 'Click on the "Total Customers" card to see customer details', 'hint' => 'Look at the top-left metric cards'],
                        ['id' => 's3', 'type' => 'action', 'content' => 'Now click on "Revenue" to view the revenue breakdown', 'hint' => 'It\'s in the same row of metric cards'],
                        ['id' => 's4', 'type' => 'success', 'content' => 'Great! You found the key metrics. These are updated in real-time.'],
                    ],
                ],
                [
                    'id' => 'read_activity_feed',
                    'title' => 'Read Activity Feed',
                    'description' => 'Understand the recent transactions and activity feed',
                    'steps' => [
                        ['id' => 's1', 'type' => 'instruction', 'content' => 'The activity feed shows real-time transactions. Let\'s explore it.'],
                        ['id' => 's2', 'type' => 'action', 'content' => 'Scroll down to the "Recent Transactions" section and click on any transaction', 'hint' => 'The feed is below the metric cards'],
                        ['id' => 's3', 'type' => 'action', 'content' => 'Click the date filter and select "Last 7 Days" to narrow the feed', 'hint' => 'The date filter is at the top-right of the feed'],
                        ['id' => 's4', 'type' => 'success', 'content' => 'Well done! The activity feed helps you spot issues faster than summary metrics.'],
                    ],
                ],
                [
                    'id' => 'check_customer_summary',
                    'title' => 'Check Customer Summary',
                    'description' => 'Review the customer summary panel and understand active vs total',
                    'steps' => [
                        ['id' => 's1', 'type' => 'instruction', 'content' => 'Let\'s learn the difference between total and active customers.'],
                        ['id' => 's2', 'type' => 'action', 'content' => 'Click on the "Customer Summary" panel to expand the breakdown', 'hint' => 'Look for the panel that shows total and active counts side by side'],
                        ['id' => 's3', 'type' => 'action', 'content' => 'Toggle the view to see "Active Customers Only" by clicking the filter toggle', 'hint' => 'There is a toggle switch above the customer list'],
                        ['id' => 's4', 'type' => 'success', 'content' => 'Perfect! Remember: total includes everyone who ever signed up, active means recently transacted.'],
                    ],
                ],
            ],
        ]]);
    }

    // ─── Module 2: Campaign Creation ────────────────────────────────────

    private function seedCampaignsPrototype(): void
    {
        TrainingModule::where('slug', 'campaigns')->update(['prototype_config' => [
            'enabled' => true,
            'title' => 'Practice: Campaign Creation',
            'description' => 'Walk through creating and launching a campaign step by step',
            'points_reward' => 30,
            'flows' => [
                [
                    'id' => 'create_sms_campaign',
                    'title' => 'Create SMS Campaign',
                    'description' => 'Set up a new SMS campaign from scratch',
                    'steps' => [
                        ['id' => 's1', 'type' => 'instruction', 'content' => 'Let\'s create an SMS campaign together. We\'ll go through each step.'],
                        ['id' => 's2', 'type' => 'action', 'content' => 'Click "New Campaign" and select "SMS" as the campaign type', 'hint' => 'The New Campaign button is at the top-right of the campaigns page'],
                        ['id' => 's3', 'type' => 'action', 'content' => 'Enter a campaign name and write your message in the text area', 'hint' => 'Keep the message under 160 characters for a single SMS'],
                        ['id' => 's4', 'type' => 'action', 'content' => 'Click "Preview" to review your message before proceeding', 'hint' => 'The Preview button is below the message text area'],
                        ['id' => 's5', 'type' => 'success', 'content' => 'Your SMS campaign draft is ready! Always preview before sending.'],
                    ],
                ],
                [
                    'id' => 'set_target_audience',
                    'title' => 'Set Target Audience',
                    'description' => 'Define who should receive your campaign',
                    'steps' => [
                        ['id' => 's1', 'type' => 'instruction', 'content' => 'Targeting the right audience is key to campaign success.'],
                        ['id' => 's2', 'type' => 'action', 'content' => 'Click "Select Audience" and choose a customer segment instead of "All Customers"', 'hint' => 'Segments are listed in the dropdown — pick one based on activity or location'],
                        ['id' => 's3', 'type' => 'action', 'content' => 'Review the estimated reach number and confirm your selection', 'hint' => 'The reach count updates automatically when you select a segment'],
                        ['id' => 's4', 'type' => 'success', 'content' => 'Segmented targeting leads to higher engagement. Never blast everyone!'],
                    ],
                ],
                [
                    'id' => 'schedule_and_launch',
                    'title' => 'Schedule & Launch',
                    'description' => 'Set the campaign schedule and launch it',
                    'steps' => [
                        ['id' => 's1', 'type' => 'instruction', 'content' => 'Now let\'s schedule the campaign for the right time.'],
                        ['id' => 's2', 'type' => 'action', 'content' => 'Set the start date and time — choose a time between 10 AM and 7 PM', 'hint' => 'Avoid early morning or late night sends to prevent unsubscribes'],
                        ['id' => 's3', 'type' => 'action', 'content' => 'Set an end date for the campaign (do not leave it open-ended)', 'hint' => 'The end date field is right below the start date'],
                        ['id' => 's4', 'type' => 'success', 'content' => 'Campaign scheduled! Always set an end date to avoid draining your reward budget.'],
                    ],
                ],
            ],
        ]]);
    }

    // ─── Module 3: Customer Upload ──────────────────────────────────────

    private function seedCustomersPrototype(): void
    {
        TrainingModule::where('slug', 'customers')->update(['prototype_config' => [
            'enabled' => true,
            'title' => 'Practice: Customer Upload',
            'description' => 'Walk through preparing and uploading a customer CSV file',
            'points_reward' => 30,
            'flows' => [
                [
                    'id' => 'prepare_csv_file',
                    'title' => 'Prepare CSV File',
                    'description' => 'Set up a properly formatted CSV for import',
                    'steps' => [
                        ['id' => 's1', 'type' => 'instruction', 'content' => 'Before uploading, you need a properly formatted CSV. Let\'s prepare one.'],
                        ['id' => 's2', 'type' => 'action', 'content' => 'Download the sample CSV template by clicking "Download Template"', 'hint' => 'The template link is on the Customer Upload page'],
                        ['id' => 's3', 'type' => 'action', 'content' => 'Open the template and verify the column headers: Name, Phone, Email', 'hint' => 'Headers must match exactly — case matters'],
                        ['id' => 's4', 'type' => 'success', 'content' => 'Template ready! Always use the official template to avoid header mismatches.'],
                    ],
                ],
                [
                    'id' => 'upload_and_map_columns',
                    'title' => 'Upload & Map Columns',
                    'description' => 'Upload your CSV and map the columns correctly',
                    'steps' => [
                        ['id' => 's1', 'type' => 'instruction', 'content' => 'Now let\'s upload the CSV and map the columns.'],
                        ['id' => 's2', 'type' => 'action', 'content' => 'Click "Upload CSV" and select your prepared file', 'hint' => 'The upload button is at the top of the Customers page'],
                        ['id' => 's3', 'type' => 'action', 'content' => 'In the column mapping screen, verify that Name, Phone, and Email are correctly mapped', 'hint' => 'Dropdowns next to each detected column let you map them'],
                        ['id' => 's4', 'type' => 'action', 'content' => 'Click "Validate" to check for errors before importing', 'hint' => 'Validation runs a dry-run without actually importing'],
                        ['id' => 's5', 'type' => 'success', 'content' => 'File validated! Always validate before importing to catch errors early.'],
                    ],
                ],
                [
                    'id' => 'handle_validation_errors',
                    'title' => 'Handle Validation Errors',
                    'description' => 'Review and fix errors after an upload attempt',
                    'steps' => [
                        ['id' => 's1', 'type' => 'instruction', 'content' => 'Sometimes uploads have errors. Let\'s learn how to handle them.'],
                        ['id' => 's2', 'type' => 'action', 'content' => 'After uploading, click "View Error Log" to see which rows failed', 'hint' => 'The error log link appears after every import, even successful ones'],
                        ['id' => 's3', 'type' => 'action', 'content' => 'Download the failed rows CSV, fix the issues (phone format, duplicates), and re-upload', 'hint' => 'The "Download Failed Rows" button is at the bottom of the error log'],
                        ['id' => 's4', 'type' => 'success', 'content' => 'Error handling complete! Always check error logs — even successful imports can have partial failures.'],
                    ],
                ],
            ],
        ]]);
    }

    // ─── Module 4: Coupon & Reward Setup ────────────────────────────────

    private function seedRewardsPrototype(): void
    {
        TrainingModule::where('slug', 'rewards')->update(['prototype_config' => [
            'enabled' => true,
            'title' => 'Practice: Reward Setup',
            'description' => 'Walk through creating coupons, setting reward tiers, and previewing the customer experience',
            'points_reward' => 30,
            'flows' => [
                [
                    'id' => 'create_coupon_rule',
                    'title' => 'Create a Coupon Rule',
                    'description' => 'Set up a new coupon with proper rules and expiry',
                    'steps' => [
                        ['id' => 's1', 'type' => 'instruction', 'content' => 'Let\'s create a coupon rule from scratch with proper settings.'],
                        ['id' => 's2', 'type' => 'action', 'content' => 'Click "Create New Coupon" and select the coupon type (Flat Discount or Percentage)', 'hint' => 'The Create button is at the top of the Rewards page'],
                        ['id' => 's3', 'type' => 'action', 'content' => 'Set the discount value and minimum purchase amount', 'hint' => 'Keep the minimum achievable — too high and customers won\'t bother'],
                        ['id' => 's4', 'type' => 'action', 'content' => 'Set an expiry date between 30 and 90 days from today', 'hint' => 'The expiry field is in the "Validity" section'],
                        ['id' => 's5', 'type' => 'success', 'content' => 'Coupon created with proper expiry! Rewards without expiry accumulate liability.'],
                    ],
                ],
                [
                    'id' => 'set_reward_tiers',
                    'title' => 'Set Reward Tiers',
                    'description' => 'Configure point-based reward tiers for customers',
                    'steps' => [
                        ['id' => 's1', 'type' => 'instruction', 'content' => 'Reward tiers motivate customers to keep coming back. Let\'s set them up.'],
                        ['id' => 's2', 'type' => 'action', 'content' => 'Navigate to "Reward Tiers" and click "Add Tier" to create a new level', 'hint' => 'The Reward Tiers tab is next to Coupons on the Rewards page'],
                        ['id' => 's3', 'type' => 'action', 'content' => 'Set the points threshold to an achievable number (e.g., 100 points for first tier)', 'hint' => 'Keep it achievable in 5-10 visits so customers stay motivated'],
                        ['id' => 's4', 'type' => 'success', 'content' => 'Tier created! Remember: if thresholds are too high, customers lose motivation.'],
                    ],
                ],
                [
                    'id' => 'preview_customer_experience',
                    'title' => 'Preview Customer Experience',
                    'description' => 'See what the customer sees when redeeming a reward',
                    'steps' => [
                        ['id' => 's1', 'type' => 'instruction', 'content' => 'Before going live, always test the redemption flow.'],
                        ['id' => 's2', 'type' => 'action', 'content' => 'Click "Preview as Customer" on any active coupon to see the customer view', 'hint' => 'The preview button is in the coupon detail page actions'],
                        ['id' => 's3', 'type' => 'action', 'content' => 'Walk through the redemption steps and verify the discount applies correctly', 'hint' => 'Click "Simulate Redemption" at the bottom of the preview'],
                        ['id' => 's4', 'type' => 'success', 'content' => 'Preview verified! Always test redemption yourself before publishing to customers.'],
                    ],
                ],
            ],
        ]]);
    }

    // ─── Module 5: Reports Basics ───────────────────────────────────────

    private function seedReportsPrototype(): void
    {
        TrainingModule::where('slug', 'reports')->update(['prototype_config' => [
            'enabled' => true,
            'title' => 'Practice: Reports Navigation',
            'description' => 'Walk through pulling reports, applying filters, and exporting data',
            'points_reward' => 30,
            'flows' => [
                [
                    'id' => 'pull_sales_report',
                    'title' => 'Pull a Sales Report',
                    'description' => 'Navigate to the reports section and pull a sales report',
                    'steps' => [
                        ['id' => 's1', 'type' => 'instruction', 'content' => 'Reports turn data into decisions. Let\'s pull your first sales report.'],
                        ['id' => 's2', 'type' => 'action', 'content' => 'Navigate to the Reports section and click on "Sales Report"', 'hint' => 'Reports is in the main navigation — Sales Report is the first option'],
                        ['id' => 's3', 'type' => 'action', 'content' => 'Review the key metrics: total revenue, average transaction value, and transaction count', 'hint' => 'These metrics are displayed at the top of the report'],
                        ['id' => 's4', 'type' => 'success', 'content' => 'Sales report pulled! Focus on trends, not just single numbers.'],
                    ],
                ],
                [
                    'id' => 'apply_date_filters',
                    'title' => 'Apply Date Filters',
                    'description' => 'Filter reports by date range for meaningful comparisons',
                    'steps' => [
                        ['id' => 's1', 'type' => 'instruction', 'content' => 'Date filtering is essential — raw numbers without date context are misleading.'],
                        ['id' => 's2', 'type' => 'action', 'content' => 'Click the date range picker and select "Last 7 Days"', 'hint' => 'The date picker is at the top-right of every report'],
                        ['id' => 's3', 'type' => 'action', 'content' => 'Now switch to "Last 30 Days" and compare the trends', 'hint' => 'Compare same-length periods for meaningful insights'],
                        ['id' => 's4', 'type' => 'success', 'content' => 'Filtered! Always compare equal time periods (week vs week, month vs month).'],
                    ],
                ],
                [
                    'id' => 'export_report_data',
                    'title' => 'Export Report Data',
                    'description' => 'Export a report for team review',
                    'steps' => [
                        ['id' => 's1', 'type' => 'instruction', 'content' => 'Exporting reports weekly keeps your team aligned. Let\'s try it.'],
                        ['id' => 's2', 'type' => 'action', 'content' => 'Click the "Export" button and choose CSV format', 'hint' => 'The Export button is at the top-right, next to the date filter'],
                        ['id' => 's3', 'type' => 'action', 'content' => 'Confirm the download and verify the file opens correctly', 'hint' => 'The file downloads to your default downloads folder'],
                        ['id' => 's4', 'type' => 'success', 'content' => 'Report exported! Set a weekly habit to export and review with your team.'],
                    ],
                ],
            ],
        ]]);
    }

    // ─── Module 6: eWards Instant Pass ──────────────────────────────────

    private function seedWhatsAppEwardsPrototype(): void
    {
        TrainingModule::where('slug', 'whatsapp-ewards')->update(['prototype_config' => [
            'enabled' => true,
            'title' => 'Practice: eWards Instant Pass Flows',
            'description' => 'Simulate the WhatsApp bot interactions that customers experience',
            'points_reward' => 30,
            'flows' => [
                [
                    'id' => 'otp_lookup',
                    'title' => 'OTP Lookup',
                    'description' => 'Walk through the OTP lookup flow as a customer would experience it',
                    'steps' => [
                        ['id' => 's1', 'type' => 'instruction', 'content' => 'A registered customer wants their OTP. Let\'s see what happens.'],
                        ['id' => 's2', 'type' => 'action', 'content' => 'The customer scans the QR code — tap the QR code to simulate scanning', 'hint' => 'The QR code is displayed at the top of the simulation'],
                        ['id' => 's3', 'type' => 'action', 'content' => 'Type "OTP" in the chat input and send the message', 'hint' => 'Commands are case-insensitive — OTP, otp, Otp all work'],
                        ['id' => 's4', 'type' => 'action', 'content' => 'Observe the bot response — it shows the existing OTP, it does NOT create a new one', 'hint' => 'This is the most common misconception staff have'],
                        ['id' => 's5', 'type' => 'success', 'content' => 'Correct! WhatsApp shows the existing OTP. It cannot create new OTPs. Only registered members can see this.'],
                    ],
                ],
                [
                    'id' => 'check_points_balance',
                    'title' => 'Check Points Balance',
                    'description' => 'See how customers check their loyalty points via WhatsApp',
                    'steps' => [
                        ['id' => 's1', 'type' => 'instruction', 'content' => 'Customers can check their points balance instantly via WhatsApp.'],
                        ['id' => 's2', 'type' => 'action', 'content' => 'Type "Points" in the chat input and send the message', 'hint' => 'Only registered members will get a points response'],
                        ['id' => 's3', 'type' => 'action', 'content' => 'Review the bot response showing the customer\'s current points balance', 'hint' => 'The response includes the balance and recent points activity'],
                        ['id' => 's4', 'type' => 'success', 'content' => 'Points balance checked! Only registered members can see their balance.'],
                    ],
                ],
                [
                    'id' => 'view_coupon_list',
                    'title' => 'View Coupon List',
                    'description' => 'See how customers view their available coupons',
                    'steps' => [
                        ['id' => 's1', 'type' => 'instruction', 'content' => 'Customers can view their active coupons by messaging the bot.'],
                        ['id' => 's2', 'type' => 'action', 'content' => 'Type "Coupon" in the chat input and send the message', 'hint' => '"Coupon", "Promo", "Deal", or "Offer" all trigger the same response'],
                        ['id' => 's3', 'type' => 'action', 'content' => 'Review the response — up to 5 active coupons sorted by soonest expiry are shown', 'hint' => 'Expired or fully used coupons are automatically hidden'],
                        ['id' => 's4', 'type' => 'success', 'content' => 'Coupon list displayed! Only valid, non-expired coupons appear. If a customer says coupons are missing, check if they expired.'],
                    ],
                ],
                [
                    'id' => 'enroll_new_member',
                    'title' => 'Enroll New Member',
                    'description' => 'Walk through the Join flow for new customer enrollment',
                    'steps' => [
                        ['id' => 's1', 'type' => 'instruction', 'content' => 'New customers can join the loyalty program in 10 seconds via WhatsApp.'],
                        ['id' => 's2', 'type' => 'action', 'content' => 'Type "Join" in the chat input and send the message', 'hint' => 'This starts the enrollment flow for non-members'],
                        ['id' => 's3', 'type' => 'action', 'content' => 'The bot asks for confirmation — type "YES" and send within the 10-minute window', 'hint' => 'If the customer waits longer than 10 minutes, they need to type "Join" again'],
                        ['id' => 's4', 'type' => 'action', 'content' => 'Observe the confirmation message — the customer is now enrolled as a member', 'hint' => 'Note: Welcome rewards are NOT given through WhatsApp enrollment'],
                        ['id' => 's5', 'type' => 'success', 'content' => 'Member enrolled! Remember: welcome rewards are NOT automatically given via WhatsApp enrollment. Set the right expectation with customers.'],
                    ],
                ],
                [
                    'id' => 'handle_unregistered_user',
                    'title' => 'Handle Unregistered User',
                    'description' => 'See what happens when a non-member tries member-only commands',
                    'steps' => [
                        ['id' => 's1', 'type' => 'instruction', 'content' => 'What happens when someone who is not a member tries to check OTP or Points?'],
                        ['id' => 's2', 'type' => 'action', 'content' => 'As an unregistered number, type "OTP" and observe the response', 'hint' => 'The bot will explain that this feature is for members only'],
                        ['id' => 's3', 'type' => 'action', 'content' => 'Notice the helpful guide message that suggests typing "Join" to become a member', 'hint' => 'The bot always provides a path forward for non-members'],
                        ['id' => 's4', 'type' => 'success', 'content' => 'Non-members get a friendly guide message. Always encourage them to type "Join" — enrollment takes just 10 seconds.'],
                    ],
                ],
            ],
        ]]);
    }
}
