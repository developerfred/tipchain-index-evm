import {
  TipChain,
  Creator,
  CreatorRegistration,
  Tip,
  Token,
  TipRelation,
  DailyStats,
  PlatformConfig,
  PlatformFeeUpdate,
  FeeCollectorUpdate,
  OwnershipTransfer,
  PauseEvent,
  UnpauseEvent,
  GasPoolRefill,
  GasSponsorship,
  EmergencyWithdraw,
  CreatorUpdate
} from "generated";


TipChain.CreatorUpdated.handler(async ({ event, context }) => {
  const creatorAddress = event.params.creator.toLowerCase();

  const creator = await context.Creator.get(creatorAddress);

  if (creator) {
    const updatedCreator: Creator = {
      ...creator,
      displayName: event.params.displayName,
      bio: event.params.bio,
      avatarUrl: event.params.avatarUrl,
      updatedAt: BigInt(event.block.timestamp),
    };

    context.Creator.set(updatedCreator);

    const updateEvent: CreatorUpdate = {
      id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
      creator_id: creatorAddress,
      displayName: event.params.displayName,
      bio: event.params.bio,
      avatarUrl: event.params.avatarUrl,
      timestamp: BigInt(event.block.timestamp),
      blockNumber: BigInt(event.block.number),
      transactionHash: event.transaction.hash,
    };

    context.CreatorUpdate.set(updateEvent);
  }
});

TipChain.CreatorRegistered.handler(async ({ event, context }) => {
  const creatorAddress = event.params.creator.toLowerCase();

  const creator: Creator = {
    id: creatorAddress,
    address: creatorAddress,
    basename: event.params.basename,
    displayName: event.params.displayName,
    bio: "",
    avatarUrl: "",
    registeredAt: event.params.timestamp,
    updatedAt: event.params.timestamp,
    totalTipsReceived: 0n,
    totalTipsSent: 0n,
    totalAmountReceived: 0n,
    totalAmountSent: 0n,
    tipCount: 0,
    tippedByCount: 0,
    isActive: true,
  };

  context.Creator.set(creator);

  const registrationEvent: CreatorRegistration = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    creator_id: creatorAddress,
    basename: event.params.basename,
    displayName: event.params.displayName,
    timestamp: event.params.timestamp,
    blockNumber: BigInt(event.block.number),
    transactionHash: event.transaction.hash,
  };

  context.CreatorRegistration.set(registrationEvent);
});


TipChain.TipSent.handler(async ({ event, context }) => {
  const fromAddress = event.params.from.toLowerCase();
  const toAddress = event.params.to.toLowerCase();
  const tokenAddress = event.params.token.toLowerCase();
  const amount = event.params.amount;

  const tipId = `${event.chainId}_${event.block.number}_${event.logIndex}`;
  const tip: Tip = {
    id: tipId,
    from_id: fromAddress,
    to_id: toAddress,
    token_id: tokenAddress,
    amount: amount,
    message: event.params.message,
    timestamp: event.params.timestamp,
    blockNumber: BigInt(event.block.number),
    transactionHash: event.transaction.hash,
  };

  context.Tip.set(tip);

  
  let sender = await context.Creator.get(fromAddress);
  if (!sender) {
    sender = {
      id: fromAddress,
      address: fromAddress,
      basename: "",
      displayName: "Unknown",
      bio: "",
      avatarUrl: "",
      registeredAt: event.params.timestamp,
      updatedAt: event.params.timestamp,
      totalTipsReceived: 0n,
      totalTipsSent: 0n,
      totalAmountReceived: 0n,
      totalAmountSent: 0n,
      tipCount: 0,
      tippedByCount: 0,
      isActive: true,
    };
  }

  const updatedSender: Creator = {
    ...sender,
    totalTipsSent: sender.totalTipsSent + 1n,
    totalAmountSent: sender.totalAmountSent + amount,
    updatedAt: event.params.timestamp,
  };
  context.Creator.set(updatedSender);

  
  let recipient = await context.Creator.get(toAddress);
  if (!recipient) {
    recipient = {
      id: toAddress,
      address: toAddress,
      basename: "",
      displayName: "Unknown",
      bio: "",
      avatarUrl: "",
      registeredAt: event.params.timestamp,
      updatedAt: event.params.timestamp,
      totalTipsReceived: 0n,
      totalTipsSent: 0n,
      totalAmountReceived: 0n,
      totalAmountSent: 0n,
      tipCount: 0,
      tippedByCount: 0,
      isActive: true,
    };
  }

  const updatedRecipient: Creator = {
    ...recipient,
    totalTipsReceived: recipient.totalTipsReceived + 1n,
    totalAmountReceived: recipient.totalAmountReceived + amount,
    updatedAt: event.params.timestamp,
  };
  context.Creator.set(updatedRecipient);

  
  let token = await context.Token.get(tokenAddress);
  if (!token) {
    token = {
      id: tokenAddress,
      address: tokenAddress,
      totalVolume: 0n,
      totalTips: 0n,
      uniqueSenders: 0,
      uniqueReceivers: 0,
    };
  }

  const updatedToken: Token = {
    ...token,
    totalVolume: token.totalVolume + amount,
    totalTips: token.totalTips + 1n,
  };
  context.Token.set(updatedToken);

  
  const relationId = `${fromAddress}_${toAddress}`;
  let relation = await context.TipRelation.get(relationId);

  if (!relation) {
    relation = {
      id: relationId,
      from_id: fromAddress,
      to_id: toAddress,
      totalTips: 0n,
      totalAmount: 0n,
      firstTipAt: event.params.timestamp,
      lastTipAt: event.params.timestamp,
    };
  }

  
  const updatedRelation: TipRelation = {
    ...relation,
    totalTips: relation.totalTips + 1n, 
    totalAmount: relation.totalAmount + amount,
    lastTipAt: event.params.timestamp,
    firstTipAt: relation.firstTipAt, 
  };
  context.TipRelation.set(updatedRelation);

  
  const dayId = Math.floor(Number(event.params.timestamp) / 86400);
  const dailyStatsId = `${dayId}`;
  let dailyStats = await context.DailyStats.get(dailyStatsId);

  if (!dailyStats) {
    dailyStats = {
      id: dailyStatsId,
      date: BigInt(dayId * 86400),
      totalTips: 0n,
      totalVolume: 0n,
      uniqueSenders: 0,
      uniqueReceivers: 0,
      activeCreators: 0,
    };
  }

  const updatedDailyStats: DailyStats = {
    ...dailyStats,
    totalTips: dailyStats.totalTips + 1n,
    totalVolume: dailyStats.totalVolume + amount,
  };
  context.DailyStats.set(updatedDailyStats);
});

TipChain.PlatformFeeUpdated.handler(async ({ event, context }) => {
  const feeUpdate: PlatformFeeUpdate = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    oldFee: event.params.oldFee,
    newFee: event.params.newFee,
    timestamp: BigInt(event.block.timestamp),
    blockNumber: BigInt(event.block.number),
    transactionHash: event.transaction.hash,
  };

  context.PlatformFeeUpdate.set(feeUpdate);

  let config = await context.PlatformConfig.get("global");
  if (!config) {
    config = {
      id: "global",
      currentFee: event.params.newFee,
      feeCollector: "",
      isPaused: false,
      owner: "",
      lastUpdated: BigInt(event.block.timestamp),
    };
  } else {
    config = {
      ...config,
      currentFee: event.params.newFee,
      lastUpdated: BigInt(event.block.timestamp),
    };
  }

  context.PlatformConfig.set(config);
});

TipChain.FeeCollectorUpdated.handler(async ({ event, context }) => {
  const collectorUpdate: FeeCollectorUpdate = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    oldCollector: event.params.oldCollector,
    newCollector: event.params.newCollector,
    timestamp: BigInt(event.block.timestamp),
    blockNumber: BigInt(event.block.number),
    transactionHash: event.transaction.hash,
  };

  context.FeeCollectorUpdate.set(collectorUpdate);

  let config = await context.PlatformConfig.get("global");
  if (!config) {
    config = {
      id: "global",
      currentFee: 0n,
      feeCollector: event.params.newCollector,
      isPaused: false,
      owner: "",
      lastUpdated: BigInt(event.block.timestamp),
    };
  } else {
    config = {
      ...config,
      feeCollector: event.params.newCollector,
      lastUpdated: BigInt(event.block.timestamp),
    };
  }

  context.PlatformConfig.set(config);
});

TipChain.OwnershipTransferred.handler(async ({ event, context }) => {
  const ownershipTransfer: OwnershipTransfer = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    previousOwner: event.params.previousOwner,
    newOwner: event.params.newOwner,
    timestamp: BigInt(event.block.timestamp),
    blockNumber: BigInt(event.block.number),
    transactionHash: event.transaction.hash,
  };

  context.OwnershipTransfer.set(ownershipTransfer);

  let config = await context.PlatformConfig.get("global");
  if (!config) {
    config = {
      id: "global",
      currentFee: 0n,
      feeCollector: "",
      isPaused: false,
      owner: event.params.newOwner,
      lastUpdated: BigInt(event.block.timestamp),
    };
  } else {
    config = {
      ...config,
      owner: event.params.newOwner,
      lastUpdated: BigInt(event.block.timestamp),
    };
  }

  context.PlatformConfig.set(config);
});

TipChain.Paused.handler(async ({ event, context }) => {
  const pauseEvent: PauseEvent = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    account: event.params.account,
    timestamp: BigInt(event.block.timestamp),
    blockNumber: BigInt(event.block.number),
    transactionHash: event.transaction.hash,
  };

  context.PauseEvent.set(pauseEvent);

  let config = await context.PlatformConfig.get("global");
  if (!config) {
    config = {
      id: "global",
      currentFee: 0n,
      feeCollector: "",
      isPaused: true,
      owner: "",
      lastUpdated: BigInt(event.block.timestamp),
    };
  } else {
    config = {
      ...config,
      isPaused: true,
      lastUpdated: BigInt(event.block.timestamp),
    };
  }

  context.PlatformConfig.set(config);
});

TipChain.Unpaused.handler(async ({ event, context }) => {
  const unpauseEvent: UnpauseEvent = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    account: event.params.account,
    timestamp: BigInt(event.block.timestamp),
    blockNumber: BigInt(event.block.number),
    transactionHash: event.transaction.hash,
  };

  context.UnpauseEvent.set(unpauseEvent);

  let config = await context.PlatformConfig.get("global");
  if (!config) {
    config = {
      id: "global",
      currentFee: 0n,
      feeCollector: "",
      isPaused: false,
      owner: "",
      lastUpdated: BigInt(event.block.timestamp),
    };
  } else {
    config = {
      ...config,
      isPaused: false,
      lastUpdated: BigInt(event.block.timestamp),
    };
  }

  context.PlatformConfig.set(config);
});

TipChain.GasPoolRefilled.handler(async ({ event, context }) => {
  const refillEvent: GasPoolRefill = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    funder: event.params.funder,
    amount: event.params.amount,
    timestamp: BigInt(event.block.timestamp),
    blockNumber: BigInt(event.block.number),
    transactionHash: event.transaction.hash,
  };

  context.GasPoolRefill.set(refillEvent);
});

TipChain.GasSponsorshipProvided.handler(async ({ event, context }) => {
  const sponsorshipEvent: GasSponsorship = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    user: event.params.user,
    amount: event.params.amount,
    timestamp: BigInt(event.block.timestamp),
    blockNumber: BigInt(event.block.number),
    transactionHash: event.transaction.hash,
  };

  context.GasSponsorship.set(sponsorshipEvent);
});

TipChain.EmergencyWithdraw.handler(async ({ event, context }) => {
  const withdrawEvent: EmergencyWithdraw = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    to: event.params.to,
    amount: event.params.amount,
    timestamp: BigInt(event.block.timestamp),
    blockNumber: BigInt(event.block.number),
    transactionHash: event.transaction.hash,
  };

  context.EmergencyWithdraw.set(withdrawEvent);
});