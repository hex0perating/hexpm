#!/bin/bash

USERNAME=$_USERNAME
PASSWORD=$_PASSWORD
HOSTNAME=$_HOSTNAME

UEFI_PARTITION=$_UEFI_PARTITION

echo "Creating a new user: $USERNAME"
useradd -m $USERNAME
echo "Assigning password..."
echo "$USERNAME:$PASSWORD" | chpasswd
echo "Creating a new hostname: $HOSTNAME"
echo "$HOSTNAME" > /etc/hostname
echo "Installing other dependencies..."
pacman -S sudo sddm xorg kitty bspwm networkmanager network-manager-applet grub efibootmgr 
echo "Installing build dependencies for hexpm..."
pacman -S nodejs npm git unzip zip
echo "Downloading hexpm..."
git clone https://github.com/hex0perating/hexpm.git /tmp/hexpm 
echo "Installing hexpm..."
cd /tmp/hexpm
npm run install-deno 
npm run compile
mv /tmp/hexpm/hexpm /bin/hexpm
chmod ugo+rx /bin/hexpm
echo "Installing rice..."
sudo -u "$USERNAME" hexpm install rice dontask
echo "Enabling services..."
systemctl enable sddm
systemctl enable NetworkManager
echo "Setting up sudoers..."
echo "ALL ALL=(ALL) ALL" >> /etc/sudoers
echo "Mounting /boot/efi..."
mount $UEFI_PARTITION /boot/efi
echo "Installing GRUB..."
mkdir /boot/grub 
grub-mkconfig -o /boot/grub/grub.cfg
grub-install --target=x86_64-efi --efi-directory=/boot/efi --bootloader-id=grub --recheck
echo "Done!"