<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Merchant;
use App\Models\Outlet;

class MerchantSeeder extends Seeder
{
    public function run(): void
    {
        $m1 = Merchant::firstOrCreate(['name' => 'Spice Garden Restaurant']);
        Outlet::firstOrCreate(['merchant_id' => $m1->id, 'name' => 'Connaught Place']);
        Outlet::firstOrCreate(['merchant_id' => $m1->id, 'name' => 'Saket Mall']);
        Outlet::firstOrCreate(['merchant_id' => $m1->id, 'name' => 'Noida Sector 18']);

        $m2 = Merchant::firstOrCreate(['name' => 'Urban Style Fashion']);
        Outlet::firstOrCreate(['merchant_id' => $m2->id, 'name' => 'DLF Mall']);
        Outlet::firstOrCreate(['merchant_id' => $m2->id, 'name' => 'Pacific Mall']);

        $m3 = Merchant::firstOrCreate(['name' => 'Glow Beauty Salon']);
        Outlet::firstOrCreate(['merchant_id' => $m3->id, 'name' => 'Rajouri Garden']);
        Outlet::firstOrCreate(['merchant_id' => $m3->id, 'name' => 'Lajpat Nagar']);
    }
}
