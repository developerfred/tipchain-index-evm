import assert from "assert";
import pkg from "generated";

const { 
  TestHelpers,
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
} = pkg;

const { MockDb, TipChain } = TestHelpers;

describe("TipChain Creator Registration Tests", () => {
  const mockDb = MockDb.createMockDb();
  
  const creatorAddress = "0x1234567890123456789012345678901234567890";
  const basename = "creator.base.eth";
  const displayName = "Test Creator";
  const timestamp = 1699900000n;

  const event = TipChain.CreatorRegistered.createMockEvent({
    creator: creatorAddress,
    basename: basename,
    displayName: displayName,
    timestamp: timestamp,
    mockEventData: {
      chainId: 8453,
      block: {
        number: 1000,
        timestamp: Number(timestamp),
        hash: "0xabcd"
      },
      logIndex: 0,
      transaction: {
        hash: "0xtxhash"
      }
    }
  });

  it("should create Creator entity on registration", async () => {
    const mockDbUpdated = await TipChain.CreatorRegistered.processEvent({
      event,
      mockDb,
    });

    const actualCreator = mockDbUpdated.entities.Creator.get(
      creatorAddress.toLowerCase()
    );

    const expectedCreator: typeof Creator = {
      id: creatorAddress.toLowerCase(),
      address: creatorAddress.toLowerCase(),
      basename: basename,
      displayName: displayName,
      bio: "",
      avatarUrl: "",
      registeredAt: timestamp,
      updatedAt: timestamp,
      totalTipsReceived: 0n,
      totalTipsSent: 0n,
      totalAmountReceived: 0n,
      totalAmountSent: 0n,
      tipCount: 0,
      tippedByCount: 0,
      isActive: true,
    };

    assert.deepEqual(actualCreator, expectedCreator);
  });

  it("should create CreatorRegistration event entity", async () => {
    const mockDbUpdated = await TipChain.CreatorRegistered.processEvent({
      event,
      mockDb,
    });

    const registrationEvent = mockDbUpdated.entities.CreatorRegistration.get(
      `${event.chainId}_${event.block.number}_${event.logIndex}`
    );

    assert.equal(registrationEvent?.creator_id, creatorAddress.toLowerCase());
    assert.equal(registrationEvent?.basename, basename);
    assert.equal(registrationEvent?.displayName, displayName);
    assert.equal(registrationEvent?.timestamp, timestamp);
  });
});

describe("TipChain Creator Update Tests", () => {
  let mockDb = MockDb.createMockDb();
  
  const creatorAddress = "0x1234567890123456789012345678901234567890";
  const newDisplayName = "Updated Name";
  const newBio = "This is my bio";
  const newAvatarUrl = "https://avatar.com/image.png";

  beforeEach(() => {
    mockDb = MockDb.createMockDb();
    mockDb.entities.Creator.set({
      id: creatorAddress.toLowerCase(),
      address: creatorAddress.toLowerCase(),
      basename: "creator.base.eth",
      displayName: "Old Name",
      bio: "",
      avatarUrl: "",
      registeredAt: 1699900000n,
      updatedAt: 1699900000n,
      totalTipsReceived: 0n,
      totalTipsSent: 0n,
      totalAmountReceived: 0n,
      totalAmountSent: 0n,
      tipCount: 0,
      tippedByCount: 0,
      isActive: true,
    });
  });

  it("should update existing Creator profile", async () => {
    const event = TipChain.CreatorUpdated.createMockEvent({
      creator: creatorAddress,
      displayName: newDisplayName,
      bio: newBio,
      avatarUrl: newAvatarUrl,
      mockEventData: {
        chainId: 8453,
        block: {
          number: 2000,
          timestamp: 1699910000,
          hash: "0xabcd"
        },
        logIndex: 0,
        transaction: { 
          hash: "0xupdatetx"
        }
      }
    });

    const mockDbUpdated = await TipChain.CreatorUpdated.processEvent({
      event,
      mockDb,
    });

    const updatedCreator = mockDbUpdated.entities.Creator.get(
      creatorAddress.toLowerCase()
    );

    assert.equal(updatedCreator?.displayName, newDisplayName);
    assert.equal(updatedCreator?.bio, newBio);
    assert.equal(updatedCreator?.avatarUrl, newAvatarUrl);
    assert.equal(updatedCreator?.updatedAt, 1699910000n);
  });

  it("should create CreatorUpdate event entity", async () => {
    const event = TipChain.CreatorUpdated.createMockEvent({
      creator: creatorAddress,
      displayName: newDisplayName,
      bio: newBio,
      avatarUrl: newAvatarUrl,
      mockEventData: {
        chainId: 8453,
        block: {
          number: 2000,
          timestamp: 1699910000,
          hash: "0xabcd"
        },
        logIndex: 0,
        transaction: {
          hash: "0xupdatetx"
        }
      }
    });

    const mockDbUpdated = await TipChain.CreatorUpdated.processEvent({
      event,
      mockDb,
    });

    const updateEvent = mockDbUpdated.entities.CreatorUpdate.get(
      `${event.chainId}_${event.block.number}_${event.logIndex}`
    );

    assert.equal(updateEvent?.creator_id, creatorAddress.toLowerCase());
    assert.equal(updateEvent?.displayName, newDisplayName);
    assert.equal(updateEvent?.bio, newBio);
  });
});

describe("TipChain Tip Sent Tests", () => {
  let mockDb = MockDb.createMockDb();
  
  const fromAddress = "0x1111111111111111111111111111111111111111";
  const toAddress = "0x2222222222222222222222222222222222222222";
  const tokenAddress = "0x3333333333333333333333333333333333333333";
  const amount = 1000000000000000000n;
  const message = "Great content!";
  const timestamp = 1699900000n;

  beforeEach(() => {
    mockDb = MockDb.createMockDb();
  });

  it("should create Tip entity", async () => {
    const event = TipChain.TipSent.createMockEvent({
      from: fromAddress,
      to: toAddress,
      amount: amount,
      token: tokenAddress,
      message: message,
      timestamp: timestamp,
      mockEventData: {
        chainId: 8453,
        block: {
          number: 3000,
          timestamp: Number(timestamp),
          hash: "0xblock"
        },
        logIndex: 5,
        transaction: {
          hash: "0xtiphash"
        }
      }
    });

    const mockDbUpdated = await TipChain.TipSent.processEvent({
      event,
      mockDb,
    });

    const tip = mockDbUpdated.entities.Tip.get(
      `${event.chainId}_${event.block.number}_${event.logIndex}`
    );

    assert.equal(tip?.from_id, fromAddress.toLowerCase());
    assert.equal(tip?.to_id, toAddress.toLowerCase());
    assert.equal(tip?.token_id, tokenAddress.toLowerCase());
    assert.equal(tip?.amount, amount);
    assert.equal(tip?.message, message);
    assert.equal(tip?.timestamp, timestamp);
  });

  it("should create Creator entities for sender and receiver if they don't exist", async () => {
    const event = TipChain.TipSent.createMockEvent({
      from: fromAddress,
      to: toAddress,
      amount: amount,
      token: tokenAddress,
      message: message,
      timestamp: timestamp,
      mockEventData: {
        chainId: 8453,
        block: { number: 3000, timestamp: Number(timestamp), hash: "0xblock" },
        logIndex: 5
      }
    });

    const mockDbUpdated = await TipChain.TipSent.processEvent({
      event,
      mockDb,
    });

    const sender = mockDbUpdated.entities.Creator.get(fromAddress.toLowerCase());
    const receiver = mockDbUpdated.entities.Creator.get(toAddress.toLowerCase());

    assert.ok(sender);
    assert.ok(receiver);
    assert.equal(sender?.address, fromAddress.toLowerCase());
    assert.equal(receiver?.address, toAddress.toLowerCase());
  });

  it("should update sender statistics", async () => {
    mockDb.entities.Creator.set({
      id: fromAddress.toLowerCase(),
      address: fromAddress.toLowerCase(),
      basename: "",
      displayName: "Sender",
      bio: "",
      avatarUrl: "",
      registeredAt: timestamp,
      updatedAt: timestamp,
      totalTipsReceived: 0n,
      totalTipsSent: 0n,
      totalAmountReceived: 0n,
      totalAmountSent: 0n,
      tipCount: 0,
      tippedByCount: 0,
      isActive: true,
    });

    const event = TipChain.TipSent.createMockEvent({
      from: fromAddress,
      to: toAddress,
      amount: amount,
      token: tokenAddress,
      message: message,
      timestamp: timestamp,
      mockEventData: {
        chainId: 8453,
        block: { number: 3000, timestamp: Number(timestamp), hash: "0xblock" },
        logIndex: 5
      }
    });

    const mockDbUpdated = await TipChain.TipSent.processEvent({
      event,
      mockDb,
    });

    const sender = mockDbUpdated.entities.Creator.get(fromAddress.toLowerCase());

    assert.equal(sender?.totalTipsSent, 1n);
    assert.equal(sender?.totalAmountSent, amount);
  });

  it("should update receiver statistics", async () => {
    mockDb.entities.Creator.set({
      id: toAddress.toLowerCase(),
      address: toAddress.toLowerCase(),
      basename: "",
      displayName: "Receiver",
      bio: "",
      avatarUrl: "",
      registeredAt: timestamp,
      updatedAt: timestamp,
      totalTipsReceived: 0n,
      totalTipsSent: 0n,
      totalAmountReceived: 0n,
      totalAmountSent: 0n,
      tipCount: 0,
      tippedByCount: 0,
      isActive: true,
    });

    const event = TipChain.TipSent.createMockEvent({
      from: fromAddress,
      to: toAddress,
      amount: amount,
      token: tokenAddress,
      message: message,
      timestamp: timestamp,
      mockEventData: {
        chainId: 8453,
        block: { number: 3000, timestamp: Number(timestamp), hash: "0xblock" },
        logIndex: 5
      }
    });

    const mockDbUpdated = await TipChain.TipSent.processEvent({
      event,
      mockDb,
    });

    const receiver = mockDbUpdated.entities.Creator.get(toAddress.toLowerCase());

    assert.equal(receiver?.totalTipsReceived, 1n);
    assert.equal(receiver?.totalAmountReceived, amount);
  });

  it("should create or update Token statistics", async () => {
    const event = TipChain.TipSent.createMockEvent({
      from: fromAddress,
      to: toAddress,
      amount: amount,
      token: tokenAddress,
      message: message,
      timestamp: timestamp,
      mockEventData: {
        chainId: 8453,
        block: { number: 3000, timestamp: Number(timestamp), hash: "0xblock" },
        logIndex: 5
      }
    });

    const mockDbUpdated = await TipChain.TipSent.processEvent({
      event,
      mockDb,
    });

    const token = mockDbUpdated.entities.Token.get(tokenAddress.toLowerCase());

    assert.ok(token);
    assert.equal(token?.totalVolume, amount);
    assert.equal(token?.totalTips, 1n);
  });

  it("should create TipRelation between sender and receiver", async () => {
    const event = TipChain.TipSent.createMockEvent({
      from: fromAddress,
      to: toAddress,
      amount: amount,
      token: tokenAddress,
      message: message,
      timestamp: timestamp,
      mockEventData: {
        chainId: 8453,
        block: { number: 3000, timestamp: Number(timestamp), hash: "0xblock" },
        logIndex: 5
      }
    });

    const mockDbUpdated = await TipChain.TipSent.processEvent({
      event,
      mockDb,
    });

    const relationId = `${fromAddress.toLowerCase()}_${toAddress.toLowerCase()}`;
    const relation = mockDbUpdated.entities.TipRelation.get(relationId);

    assert.ok(relation);
    assert.equal(relation?.totalTips, 1n);
    assert.equal(relation?.totalAmount, amount);
    assert.equal(relation?.firstTipAt, timestamp);
    assert.equal(relation?.lastTipAt, timestamp);
  });

  it("should update existing TipRelation on subsequent tips", async () => {
    const firstAmount = 500000000000000000n;
    const secondAmount = 1000000000000000000n;
    const relationId = `${fromAddress.toLowerCase()}_${toAddress.toLowerCase()}`;

    mockDb.entities.TipRelation.set({
      id: relationId,
      from_id: fromAddress.toLowerCase(),
      to_id: toAddress.toLowerCase(),
      totalTips: 1n,
      totalAmount: firstAmount,
      firstTipAt: timestamp,
      lastTipAt: timestamp,
    });

    const event = TipChain.TipSent.createMockEvent({
      from: fromAddress,
      to: toAddress,
      amount: secondAmount,
      token: tokenAddress,
      message: "Second tip",
      timestamp: timestamp + 1000n,
      mockEventData: {
        chainId: 8453,
        block: { number: 3001, timestamp: Number(timestamp + 1000n), hash: "0xblock2" },
        logIndex: 1
      }
    });

    const mockDbUpdated = await TipChain.TipSent.processEvent({
      event,
      mockDb,
    });

    const relation = mockDbUpdated.entities.TipRelation.get(relationId);

    assert.equal(relation?.totalTips, 2n);
    assert.equal(relation?.totalAmount, firstAmount + secondAmount);
    assert.equal(relation?.lastTipAt, timestamp + 1000n);
  });

  it("should create or update DailyStats", async () => {
    const event = TipChain.TipSent.createMockEvent({
      from: fromAddress,
      to: toAddress,
      amount: amount,
      token: tokenAddress,
      message: message,
      timestamp: timestamp,
      mockEventData: {
        chainId: 8453,
        block: { number: 3000, timestamp: Number(timestamp), hash: "0xblock" },
        logIndex: 5
      }
    });

    const mockDbUpdated = await TipChain.TipSent.processEvent({
      event,
      mockDb,
    });

    const dayId = Math.floor(Number(timestamp) / 86400);
    const dailyStats = mockDbUpdated.entities.DailyStats.get(`${dayId}`);

    assert.ok(dailyStats);
    assert.equal(dailyStats?.totalTips, 1n);
    assert.equal(dailyStats?.totalVolume, amount);
  });
});

describe("TipChain Platform Fee Tests", () => {
  const mockDb = MockDb.createMockDb();
  
  const oldFee = 250n;
  const newFee = 500n;

  it("should create PlatformFeeUpdate entity", async () => {
    const event = TipChain.PlatformFeeUpdated.createMockEvent({
      oldFee: oldFee,
      newFee: newFee,
      mockEventData: {
        chainId: 8453,
        block: { number: 4000, timestamp: 1699920000, hash: "0xfeeblock" },
        logIndex: 0,
        transaction: { hash: "0xfeetx" }
      }
    });

    const mockDbUpdated = await TipChain.PlatformFeeUpdated.processEvent({
      event,
      mockDb,
    });

    const feeUpdate = mockDbUpdated.entities.PlatformFeeUpdate.get(
      `${event.chainId}_${event.block.number}_${event.logIndex}`
    );

    assert.equal(feeUpdate?.oldFee, oldFee);
    assert.equal(feeUpdate?.newFee, newFee);
  });

  it("should update PlatformConfig with new fee", async () => {
    const event = TipChain.PlatformFeeUpdated.createMockEvent({
      oldFee: oldFee,
      newFee: newFee,
      mockEventData: {
        chainId: 8453,
        block: { number: 4000, timestamp: 1699920000, hash: "0xfeeblock" },
        logIndex: 0
      }
    });

    const mockDbUpdated = await TipChain.PlatformFeeUpdated.processEvent({
      event,
      mockDb,
    });

    const config = mockDbUpdated.entities.PlatformConfig.get("global");

    assert.ok(config);
    assert.equal(config?.currentFee, newFee);
  });
});

describe("TipChain Fee Collector Tests", () => {
  const mockDb = MockDb.createMockDb();
  
  const oldCollector = "0x4444444444444444444444444444444444444444";
  const newCollector = "0x5555555555555555555555555555555555555555";

  it("should create FeeCollectorUpdate entity", async () => {
    const event = TipChain.FeeCollectorUpdated.createMockEvent({
      oldCollector: oldCollector,
      newCollector: newCollector,
      mockEventData: {
        chainId: 8453,
        block: { number: 5000, timestamp: 1699930000, hash: "0xcollectorblock" },
        logIndex: 0,
        transaction: { hash: "0xcollectortx" }
      }
    });

    const mockDbUpdated = await TipChain.FeeCollectorUpdated.processEvent({
      event,
      mockDb,
    });

    const collectorUpdate = mockDbUpdated.entities.FeeCollectorUpdate.get(
      `${event.chainId}_${event.block.number}_${event.logIndex}`
    );

    assert.equal(collectorUpdate?.oldCollector, oldCollector);
    assert.equal(collectorUpdate?.newCollector, newCollector);
  });

  it("should update PlatformConfig with new collector", async () => {
    const event = TipChain.FeeCollectorUpdated.createMockEvent({
      oldCollector: oldCollector,
      newCollector: newCollector,
      mockEventData: {
        chainId: 8453,
        block: { number: 5000, timestamp: 1699930000, hash: "0xcollectorblock" },
        logIndex: 0
      }
    });

    const mockDbUpdated = await TipChain.FeeCollectorUpdated.processEvent({
      event,
      mockDb,
    });

    const config = mockDbUpdated.entities.PlatformConfig.get("global");

    assert.ok(config);
    assert.equal(config?.feeCollector, newCollector);
  });
});

describe("TipChain Ownership Tests", () => {
  const mockDb = MockDb.createMockDb();
  
  const previousOwner = "0x6666666666666666666666666666666666666666";
  const newOwner = "0x7777777777777777777777777777777777777777";

  it("should create OwnershipTransfer entity", async () => {
    const event = TipChain.OwnershipTransferred.createMockEvent({
      previousOwner: previousOwner,
      newOwner: newOwner,
      mockEventData: {
        chainId: 8453,
        block: { number: 6000, timestamp: 1699940000, hash: "0xownerblock" },
        logIndex: 0,
        transaction: { hash: "0xownertx" }
      }
    });

    const mockDbUpdated = await TipChain.OwnershipTransferred.processEvent({
      event,
      mockDb,
    });

    const ownershipTransfer = mockDbUpdated.entities.OwnershipTransfer.get(
      `${event.chainId}_${event.block.number}_${event.logIndex}`
    );

    assert.equal(ownershipTransfer?.previousOwner, previousOwner);
    assert.equal(ownershipTransfer?.newOwner, newOwner);
  });

  it("should update PlatformConfig with new owner", async () => {
    const event = TipChain.OwnershipTransferred.createMockEvent({
      previousOwner: previousOwner,
      newOwner: newOwner,
      mockEventData: {
        chainId: 8453,
        block: { number: 6000, timestamp: 1699940000, hash: "0xownerblock" },
        logIndex: 0
      }
    });

    const mockDbUpdated = await TipChain.OwnershipTransferred.processEvent({
      event,
      mockDb,
    });

    const config = mockDbUpdated.entities.PlatformConfig.get("global");

    assert.ok(config);
    assert.equal(config?.owner, newOwner);
  });
});

describe("TipChain Pause/Unpause Tests", () => {
  let mockDb = MockDb.createMockDb();
  
  const account = "0x8888888888888888888888888888888888888888";

  beforeEach(() => {
    mockDb = MockDb.createMockDb();
  });

  it("should create PauseEvent and update PlatformConfig", async () => {
    const event = TipChain.Paused.createMockEvent({
      account: account,
      mockEventData: {
        chainId: 8453,
        block: { number: 7000, timestamp: 1699950000, hash: "0xpauseblock" },
        logIndex: 0,
        transaction: { hash: "0xpausetx" }
      }
    });

    const mockDbUpdated = await TipChain.Paused.processEvent({
      event,
      mockDb,
    });

    const pauseEvent = mockDbUpdated.entities.PauseEvent.get(
      `${event.chainId}_${event.block.number}_${event.logIndex}`
    );

    assert.equal(pauseEvent?.account, account);

    const config = mockDbUpdated.entities.PlatformConfig.get("global");
    assert.equal(config?.isPaused, true);
  });

  it("should create UnpauseEvent and update PlatformConfig", async () => {
    mockDb.entities.PlatformConfig.set({
      id: "global",
      currentFee: 250n,
      feeCollector: "",
      isPaused: true,
      owner: "",
      lastUpdated: 1699950000n,
    });

    const event = TipChain.Unpaused.createMockEvent({
      account: account,
      mockEventData: {
        chainId: 8453,
        block: { number: 7001, timestamp: 1699950100, hash: "0xunpauseblock" },
        logIndex: 0,
        transaction: { hash: "0xunpausetx" }
      }
    });

    const mockDbUpdated = await TipChain.Unpaused.processEvent({
      event,
      mockDb,
    });

    const unpauseEvent = mockDbUpdated.entities.UnpauseEvent.get(
      `${event.chainId}_${event.block.number}_${event.logIndex}`
    );

    assert.equal(unpauseEvent?.account, account);

    const config = mockDbUpdated.entities.PlatformConfig.get("global");
    assert.equal(config?.isPaused, false);
  });
});

describe("TipChain Gas Sponsorship Tests", () => {
  const mockDb = MockDb.createMockDb();
  
  const funder = "0x9999999999999999999999999999999999999999";
  const user = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
  const amount = 5000000000000000000n;

  it("should create GasPoolRefill entity", async () => {
    const event = TipChain.GasPoolRefilled.createMockEvent({
      funder: funder,
      amount: amount,
      mockEventData: {
        chainId: 8453,
        block: { number: 8000, timestamp: 1699960000, hash: "0xgasblock" },
        logIndex: 0,
        transaction: { hash: "0xgastx" }
      }
    });

    const mockDbUpdated = await TipChain.GasPoolRefilled.processEvent({
      event,
      mockDb,
    });

    const refillEvent = mockDbUpdated.entities.GasPoolRefill.get(
      `${event.chainId}_${event.block.number}_${event.logIndex}`
    );

    assert.equal(refillEvent?.funder, funder);
    assert.equal(refillEvent?.amount, amount);
  });

  it("should create GasSponsorship entity", async () => {
    const event = TipChain.GasSponsorshipProvided.createMockEvent({
      user: user,
      amount: amount,
      mockEventData: {
        chainId: 8453,
        block: { number: 8001, timestamp: 1699960100, hash: "0xsponsorblock" },
        logIndex: 0,
        transaction: { hash: "0xsponsortx" }
      }
    });

    const mockDbUpdated = await TipChain.GasSponsorshipProvided.processEvent({
      event,
      mockDb,
    });

    const sponsorshipEvent = mockDbUpdated.entities.GasSponsorship.get(
      `${event.chainId}_${event.block.number}_${event.logIndex}`
    );

    assert.equal(sponsorshipEvent?.user, user);
    assert.equal(sponsorshipEvent?.amount, amount);
  });
});

describe("TipChain Emergency Withdraw Tests", () => {
  const mockDb = MockDb.createMockDb();
  
  const to = "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";
  const amount = 10000000000000000000n;

  it("should create EmergencyWithdraw entity", async () => {
    const event = TipChain.EmergencyWithdraw.createMockEvent({
      to: to,
      amount: amount,
      mockEventData: {
        chainId: 8453,
        block: { number: 9000, timestamp: 1699970000, hash: "0xemergencyblock" },
        logIndex: 0,
        transaction: { hash: "0xemergencytx" }
      }
    });

    const mockDbUpdated = await TipChain.EmergencyWithdraw.processEvent({
      event,
      mockDb,
    });

    const withdrawEvent = mockDbUpdated.entities.EmergencyWithdraw.get(
      `${event.chainId}_${event.block.number}_${event.logIndex}`
    );

    assert.equal(withdrawEvent?.to, to);
    assert.equal(withdrawEvent?.amount, amount);
  });
});