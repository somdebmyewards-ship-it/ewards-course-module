<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Merchant;
use App\Models\Outlet;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $merchants = Merchant::all();
        $m1 = $merchants->where('name', 'Spice Garden Restaurant')->first();
        $m2 = $merchants->where('name', 'Urban Style Fashion')->first();
        $m3 = $merchants->where('name', 'Glow Beauty Salon')->first();

        $m1Outlets = Outlet::where('merchant_id', $m1?->id)->get();
        $m2Outlets = Outlet::where('merchant_id', $m2?->id)->get();
        $m3Outlets = Outlet::where('merchant_id', $m3?->id)->get();

        // ============ ADMIN ============
        User::create([
            'name' => 'eWards Admin',
            'email' => 'admin@ewards.com',
            'password' => Hash::make('admin123'),
            'role' => 'ADMIN',
            'designation' => 'Platform Administrator',
            'approved' => true,
        ]);

        // ============ TRAINER ============
        User::create([
            'name' => 'eWards Trainer',
            'email' => 'trainer@ewards.com',
            'password' => Hash::make('trainer123'),
            'role' => 'TRAINER',
            'designation' => 'Training Manager',
            'approved' => true,
        ]);

        // ============ MERCHANT STAFF (CASHIERS) ============
        // Spice Garden - Cashiers
        User::create([
            'name' => 'Priya Sharma',
            'email' => 'priya@spicegarden.com',
            'mobile' => '9876543210',
            'password' => Hash::make('demo123'),
            'role' => 'CASHIER',
            'designation' => 'Billing Executive',
            'merchant_id' => $m1?->id,
            'outlet_id' => $m1Outlets->first()?->id,
            'merchant_name_entered' => 'Spice Garden Restaurant',
            'outlet_name_entered' => 'Connaught Place',
            'ewards_reference' => 'eWards Admin',
            'approved' => true,
        ]);

        User::create([
            'name' => 'Amit Patel',
            'email' => 'amit@spicegarden.com',
            'mobile' => '9876543211',
            'password' => Hash::make('demo123'),
            'role' => 'CASHIER',
            'designation' => 'Billing Executive',
            'merchant_id' => $m1?->id,
            'outlet_id' => $m1Outlets->skip(1)->first()?->id,
            'merchant_name_entered' => 'Spice Garden Restaurant',
            'outlet_name_entered' => 'Saket Mall',
            'ewards_reference' => 'eWards Trainer',
            'approved' => true,
        ]);

        // Urban Style - Cashier
        User::create([
            'name' => 'Sneha Reddy',
            'email' => 'sneha@urbanstyle.com',
            'mobile' => '9876543212',
            'password' => Hash::make('demo123'),
            'role' => 'CASHIER',
            'designation' => 'Store Associate',
            'merchant_id' => $m2?->id,
            'outlet_id' => $m2Outlets->first()?->id,
            'merchant_name_entered' => 'Urban Style Fashion',
            'outlet_name_entered' => 'DLF Mall',
            'ewards_reference' => 'eWards Admin',
            'approved' => true,
        ]);

        // ============ CLIENTS (Brand Owners / Store Managers) ============
        // Spice Garden - Owner
        User::create([
            'name' => 'Rahul Verma',
            'email' => 'rahul@spicegarden.com',
            'mobile' => '9876543213',
            'password' => Hash::make('demo123'),
            'role' => 'CLIENT',
            'designation' => 'Brand Owner',
            'merchant_id' => $m1?->id,
            'merchant_name_entered' => 'Spice Garden Restaurant',
            'ewards_reference' => 'eWards Admin',
            'approved' => true,
        ]);

        // Urban Style - Marketing Head
        User::create([
            'name' => 'Neha Gupta',
            'email' => 'neha@urbanstyle.com',
            'mobile' => '9876543214',
            'password' => Hash::make('demo123'),
            'role' => 'CLIENT',
            'designation' => 'Marketing Head',
            'merchant_id' => $m2?->id,
            'merchant_name_entered' => 'Urban Style Fashion',
            'ewards_reference' => 'eWards Trainer',
            'approved' => true,
        ]);

        // Glow Beauty - Store Manager
        User::create([
            'name' => 'Kavita Singh',
            'email' => 'kavita@glowbeauty.com',
            'mobile' => '9876543215',
            'password' => Hash::make('demo123'),
            'role' => 'CLIENT',
            'designation' => 'Store Manager',
            'merchant_id' => $m3?->id,
            'outlet_id' => $m3Outlets->first()?->id,
            'merchant_name_entered' => 'Glow Beauty Salon',
            'outlet_name_entered' => 'Rajouri Garden',
            'ewards_reference' => 'eWards Admin',
            'approved' => true,
        ]);

        // ============ PENDING APPROVAL USERS ============
        User::create([
            'name' => 'Arjun Mehta',
            'email' => 'arjun@newbrand.com',
            'mobile' => '9876543216',
            'password' => Hash::make('demo123'),
            'role' => 'CASHIER',
            'designation' => 'Cashier',
            'merchant_name_entered' => 'New Brand Store',
            'outlet_name_entered' => 'Main Branch',
            'ewards_reference' => 'Rahul Verma',
            'approved' => false,
        ]);

        User::create([
            'name' => 'Divya Nair',
            'email' => 'divya@newcafe.com',
            'mobile' => '9876543217',
            'password' => Hash::make('demo123'),
            'role' => 'CLIENT',
            'designation' => 'Cafe Owner',
            'merchant_name_entered' => 'Brew House Cafe',
            'outlet_name_entered' => 'Indiranagar',
            'ewards_reference' => 'eWards Admin',
            'approved' => false,
        ]);
    }
}
