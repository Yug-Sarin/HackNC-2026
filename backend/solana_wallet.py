"""
Solana Phantom Wallet Integration Module

This module handles fictional Solana wallet operations for the HackNC-2026 app.
When users complete events and earn money, it deposits into their Phantom wallet.
When users purchase card packs, it withdraws from their Phantom wallet.
"""

import uuid
from datetime import datetime
from typing import Dict, List, Optional

class SolanaWallet:
    """Represents a fictional Solana wallet connected to Phantom"""
    
    def __init__(self, username: str):
        """
        Initialize a Solana wallet for a user.
        
        Args:
            username (str): The username associated with this wallet
        """
        self.username = username
        # Fictional wallet address (64 character hex string mimicking Solana public keys)
        self.wallet_address = self._generate_phantom_address()
        self.balance = 0.0  # Balance in fictional SOL equivalent
        self.transaction_history: List[Dict] = []
        self.created_at = datetime.now()
    
    @staticmethod
    def _generate_phantom_address() -> str:
        """
        Generate a fictional Phantom wallet address.
        Mimics a Solana public key format.
        
        Returns:
            str: A 64-character hex string representing a wallet address
        """
        return uuid.uuid4().hex + uuid.uuid4().hex[:32]
    
    def deposit(self, amount: float, event_name: str, event_id: int) -> Dict:
        """
        Deposit earnings from completed event into wallet.
        
        Args:
            amount (float): Amount to deposit
            event_name (str): Name of the event completed
            event_id (int): ID of the event
            
        Returns:
            dict: Transaction details
        """
        if amount < 0:
            return {
                "success": False,
                "message": "Cannot deposit negative amount",
                "balance": self.balance
            }
        
        transaction = {
            "type": "deposit",
            "amount": amount,
            "timestamp": datetime.now().isoformat(),
            "source": f"Event: {event_name} (ID: {event_id})",
            "transaction_id": str(uuid.uuid4()),
            "balance_before": self.balance,
            "balance_after": self.balance + amount
        }
        
        self.balance += amount
        self.transaction_history.append(transaction)
        
        return {
            "success": True,
            "message": f"Successfully deposited ${amount} for completing '{event_name}'",
            "balance": self.balance,
            "transaction_id": transaction["transaction_id"]
        }
    
    def withdraw(self, amount: float, pack_type: str) -> Dict:
        """
        Withdraw funds from wallet to purchase card pack.
        
        Args:
            amount (float): Amount to withdraw
            pack_type (str): Type of card pack being purchased
            
        Returns:
            dict: Transaction details
        """
        if amount < 0:
            return {
                "success": False,
                "message": "Cannot withdraw negative amount",
                "balance": self.balance
            }
        
        if self.balance < amount:
            return {
                "success": False,
                "message": f"Insufficient funds. Wallet balance: ${self.balance}, Required: ${amount}",
                "balance": self.balance
            }
        
        transaction = {
            "type": "withdrawal",
            "amount": amount,
            "timestamp": datetime.now().isoformat(),
            "destination": f"Card Pack Purchase: {pack_type.capitalize()}",
            "transaction_id": str(uuid.uuid4()),
            "balance_before": self.balance,
            "balance_after": self.balance - amount
        }
        
        self.balance -= amount
        self.transaction_history.append(transaction)
        
        return {
            "success": True,
            "message": f"Successfully withdrawn ${amount} for {pack_type} pack purchase",
            "balance": self.balance,
            "transaction_id": transaction["transaction_id"]
        }
    
    def get_balance(self) -> float:
        """
        Get current wallet balance.
        
        Returns:
            float: Current balance
        """
        return self.balance
    
    def get_transaction_history(self, limit: int = 50) -> List[Dict]:
        """
        Get transaction history with optional limit.
        
        Args:
            limit (int): Maximum number of recent transactions to return
            
        Returns:
            list: List of transactions, most recent first
        """
        return list(reversed(self.transaction_history[-limit:]))
    
    def get_wallet_info(self) -> Dict:
        """
        Get complete wallet information.
        
        Returns:
            dict: Wallet details including address, balance, and stats
        """
        total_deposits = sum(t["amount"] for t in self.transaction_history if t["type"] == "deposit")
        total_withdrawals = sum(t["amount"] for t in self.transaction_history if t["type"] == "withdrawal")
        
        return {
            "username": self.username,
            "wallet_address": self.wallet_address,
            "balance": self.balance,
            "total_deposits": total_deposits,
            "total_withdrawals": total_withdrawals,
            "transaction_count": len(self.transaction_history),
            "created_at": self.created_at.isoformat()
        }


class WalletManager:
    """Manages multiple user wallets"""
    
    def __init__(self):
        """Initialize the wallet manager"""
        self.wallets: Dict[str, SolanaWallet] = {}
    
    def create_wallet(self, username: str) -> SolanaWallet:
        """
        Create a new wallet for a user.
        
        Args:
            username (str): Username for the wallet
            
        Returns:
            SolanaWallet: The newly created wallet
        """
        if username in self.wallets:
            return self.wallets[username]
        
        wallet = SolanaWallet(username)
        self.wallets[username] = wallet
        return wallet
    
    def get_wallet(self, username: str) -> Optional[SolanaWallet]:
        """
        Get a user's wallet.
        
        Args:
            username (str): Username
            
        Returns:
            SolanaWallet or None: The wallet if it exists
        """
        return self.wallets.get(username)
    
    def wallet_exists(self, username: str) -> bool:
        """
        Check if a wallet exists for a user.
        
        Args:
            username (str): Username
            
        Returns:
            bool: True if wallet exists
        """
        return username in self.wallets
