<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Merchant;
use App\Models\Outlet;

class MerchantSeeder extends Seeder
{
    public function run(): void
    {
        // Merchant 1 - Restaurant chain
        $m1 = Merchant::create(['name' => 'Spice Garden Restaurant']);
        Outlet::create(['merchant_id' => $m1->id, 'name' => 'Connaught Place']);
        Outlet::create(['merchant_id' => $m1->id, 'name' => 'Saket Mall']);
        Outlet::create(['merchant_id' => $m1->id, 'name' => 'Noida Sector 18']);

        // Merchant 2 - Retail brand
        $m2 = Merchant::create(['name' => 'Urban Style Fashion']);
        Outlet::create(['merchant_id' => $m2->id, 'name' => 'DLF Mall']);
        Outlet::create(['merchant_id' => $m2->id, 'name' => 'Pacific Mall']);

        // Merchant 3 - Salon chain
        $m3 = Merchant::create(['name' => 'Glow Beauty Salon']);
        Outlet::create(['merchant_id' => $m3->id, 'name' => 'Rajouri Garden']);
        Outlet::create(['merchant_id' => $m3->id, 'name' => 'Lajpat Nagar']);
    }
}
