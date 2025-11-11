import { Response } from 'express';
import { Types } from 'mongoose';
import { AuthRequest } from '../middleware/authMiddleware.js';
import User from '../models/User.js';
import Event from '../models/Event.js';
import Business from '../models/Business.js';
import Listing from '../models/Listing.js';

export const getAdminOverview = async (req: AuthRequest, res: Response) => {
  try {
    const [
      totalUsers,
      totalEvents,
      totalBusinesses,
      pendingBusinesses,
      pendingEvents,
      pendingListings,
      attendeeStats,
    ] =
      await Promise.all([
        User.countDocuments(),
        Event.countDocuments({ $or: [{ moderationStatus: 'approved' }, { moderationStatus: { $exists: false } }] }),
        Business.countDocuments(),
        Business.countDocuments({ status: 'draft' }),
        Event.countDocuments({ moderationStatus: 'pending' }),
        Listing.countDocuments({ moderationStatus: 'pending' }),
        Event.aggregate([
          {
            $project: {
              attendeeCount: { $size: { $ifNull: ['$attendees', []] } },
            },
          },
          {
            $group: {
              _id: null,
              total: { $sum: '$attendeeCount' },
            },
          },
        ]),
      ]);

    const totalRegistrations =
      attendeeStats.length > 0 ? attendeeStats[0].total : 0;

    res.status(200).json({
      metrics: {
        totalUsers,
        totalEvents,
        totalBusinesses,
        totalRegistrations,
        pendingBusinesses,
        pendingEvents,
        pendingListings,
      },
    });
  } catch (error) {
    console.error('Admin overview error:', error);
    res.status(500).json({ error: 'Failed to load admin overview' });
  }
};

export const getAdminEvents = async (req: AuthRequest, res: Response) => {
  try {
    const events = await Event.find()
      .populate('organizerId', 'username email area workOrSchool')
      .populate('reviewedBy', 'username email')
      .populate('attendees', 'username email area workOrSchool')
      .sort({ moderationStatus: 1, date: -1 });

    const formattedEvents = events.map((event) => ({
      id: event._id.toString(),
      title: event.title,
      date: event.date,
      category: event.category,
      location: event.location,
      organizer: event.organizer,
      organizerProfile: event.organizerId
        ? {
            id: (event.organizerId as any)._id?.toString(),
            username: (event.organizerId as any).username,
            email: (event.organizerId as any).email,
            area: (event.organizerId as any).area,
            workOrSchool: (event.organizerId as any).workOrSchool,
          }
        : null,
      attendeeCount: event.attendees?.length || 0,
      attendees: (event.attendees || []).map((attendee: any) => ({
        id: attendee._id?.toString(),
        username: attendee.username,
        email: attendee.email,
        area: attendee.area,
        workOrSchool: attendee.workOrSchool,
      })),
      moderationStatus: event.moderationStatus ?? 'approved',
      rejectionReason: event.rejectionReason ?? null,
      reviewedAt: event.reviewedAt,
      reviewedBy: event.reviewedBy
        ? {
            id: (event.reviewedBy as any)._id?.toString(),
            username: (event.reviewedBy as any).username,
            email: (event.reviewedBy as any).email,
          }
        : null,
    }));

    res.status(200).json({ events: formattedEvents });
  } catch (error) {
    console.error('Admin events error:', error);
    res.status(500).json({ error: 'Failed to load events for admin' });
  }
};

export const getAdminBusinesses = async (req: AuthRequest, res: Response) => {
  try {
    const businesses = await Business.find()
      .populate('ownerId', 'username email area workOrSchool')
      .sort({ createdAt: -1 });

    const formattedBusinesses = businesses.map((business: any) => ({
      id: business._id.toString(),
      businessName: business.businessName,
      category: business.category,
      status: business.status,
      verified: business.verified,
      rating: business.rating,
      views: business.views,
      createdAt: business.createdAt,
      owner: business.ownerId
        ? {
            id: (business.ownerId as any)._id?.toString(),
            username: (business.ownerId as any).username,
            email: (business.ownerId as any).email,
            area: (business.ownerId as any).area,
            workOrSchool: (business.ownerId as any).workOrSchool,
          }
        : null,
    }));

    res.status(200).json({ businesses: formattedBusinesses });
  } catch (error) {
    console.error('Admin businesses error:', error);
    res.status(500).json({ error: 'Failed to load businesses for admin' });
  }
};

export const updateBusinessStatus = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { id } = req.params;
    const { status, verified } = req.body;

    const allowedStatuses = ['draft', 'active', 'inactive'];

    if (!status && typeof verified !== 'boolean') {
      res
        .status(400)
        .json({ error: 'Provide a new status or verified flag to update' });
      return;
    }

    if (status && !allowedStatuses.includes(status)) {
      res.status(400).json({ error: 'Invalid business status' });
      return;
    }

    const updates: Record<string, any> = {};
    if (status) {
      updates.status = status;
    }
    if (typeof verified === 'boolean') {
      updates.verified = verified;
    }

    const business = await Business.findByIdAndUpdate(id, updates, {
      new: true,
    }).populate('ownerId', 'username email area workOrSchool');

    if (!business) {
      res.status(404).json({ error: 'Business not found' });
      return;
    }

    res.status(200).json({
      message: 'Business updated successfully',
      business: {
        id: (business as any)._id.toString(),
        businessName: business.businessName,
        category: business.category,
        status: business.status,
        verified: business.verified,
        owner: business.ownerId
          ? {
              id: (business.ownerId as any)._id?.toString(),
              username: (business.ownerId as any).username,
              email: (business.ownerId as any).email,
            }
          : null,
      },
    });
  } catch (error) {
    console.error('Admin update business error:', error);
    res.status(500).json({ error: 'Failed to update business status' });
  }
};

export const getAdminListings = async (req: AuthRequest, res: Response) => {
  try {
    const listings = await Listing.find()
      .populate('sellerId', 'username email area workOrSchool')
      .populate('reviewedBy', 'username email')
      .sort({ moderationStatus: 1, createdAt: -1 });

    const formattedListings = listings.map((listing: any) => ({
      id: listing._id.toString(),
      title: listing.title,
      price: listing.price,
      category: listing.category,
      location: listing.location,
      status: listing.status,
      moderationStatus: listing.moderationStatus ?? 'approved',
      rejectionReason: listing.rejectionReason ?? null,
      createdAt: listing.createdAt,
      seller: listing.sellerId
        ? {
            id: (listing.sellerId as any)._id?.toString(),
            username: (listing.sellerId as any).username,
            email: (listing.sellerId as any).email,
            area: (listing.sellerId as any).area,
            workOrSchool: (listing.sellerId as any).workOrSchool,
          }
        : null,
      reviewedBy: listing.reviewedBy
        ? {
            id: (listing.reviewedBy as any)._id?.toString(),
            username: (listing.reviewedBy as any).username,
            email: (listing.reviewedBy as any).email,
          }
        : null,
      reviewedAt: listing.reviewedAt,
    }));

    res.status(200).json({ listings: formattedListings });
  } catch (error) {
    console.error('Admin marketplace error:', error);
    res.status(500).json({ error: 'Failed to load marketplace listings for admin' });
  }
};

export const updateEventStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, rejectionReason } = req.body;

    if (!['pending', 'approved', 'rejected'].includes(status)) {
      res.status(400).json({ error: 'Invalid moderation status' });
      return;
    }

    const event = await Event.findByIdAndUpdate(
      id,
      {
        moderationStatus: status,
        reviewedBy: (req as any).user?._id
          ? new Types.ObjectId((req as any).user._id)
          : undefined,
        reviewedAt: new Date(),
        rejectionReason: status === 'rejected' ? rejectionReason || null : null,
      },
      { new: true, runValidators: false }
    ).populate('organizerId', 'username email');

    if (!event) {
      res.status(404).json({ error: 'Event not found' });
      return;
    }

    res.status(200).json({
      message: `Event ${status}`,
      event: {
        id: event._id.toString(),
        title: event.title,
        moderationStatus: event.moderationStatus,
        rejectionReason: event.rejectionReason,
        reviewedAt: event.reviewedAt,
      },
    });
  } catch (error) {
    console.error('Admin event moderation error:', error);
    res.status(500).json({ error: 'Failed to update event status' });
  }
};

export const updateListingStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, rejectionReason } = req.body;

    if (!['pending', 'approved', 'rejected'].includes(status)) {
      res.status(400).json({ error: 'Invalid moderation status' });
      return;
    }

    const updateData: any = {
      moderationStatus: status,
      reviewedBy: (req as any).user?._id
        ? new Types.ObjectId((req as any).user._id)
        : undefined,
      reviewedAt: new Date(),
      rejectionReason: status === 'rejected' ? rejectionReason || null : null,
    };

    if (status === 'approved') {
      updateData.status = 'active';
    }

    if (status === 'rejected') {
      updateData.status = 'inactive';
    }

    const listing = await Listing.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: false,
    }).populate('sellerId', 'username email');

    if (!listing) {
      res.status(404).json({ error: 'Listing not found' });
      return;
    }

    res.status(200).json({
      message: `Listing ${status}`,
      listing: {
        id: listing._id.toString(),
        title: listing.title,
        moderationStatus: listing.moderationStatus,
        rejectionReason: listing.rejectionReason,
        status: listing.status,
        reviewedAt: listing.reviewedAt,
      },
    });
  } catch (error) {
    console.error('Admin marketplace moderation error:', error);
    res.status(500).json({ error: 'Failed to update listing status' });
  }
};

export const getAdminUsers = async (req: AuthRequest, res: Response) => {
  try {
    const { limit = 50, skip = 0, search } = req.query;
    const limitNum = Math.min(parseInt(limit as string) || 50, 100);
    const skipNum = parseInt(skip as string) || 0;

    const filter: any = {};

    // Search by username or email
    if (search) {
      filter.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(filter)
        .select('_id username email area workOrSchool age isAdmin createdAt')
        .sort({ createdAt: -1 })
        .limit(limitNum)
        .skip(skipNum),
      User.countDocuments(filter),
    ]);

    const formattedUsers = users.map((user) => ({
      id: user._id.toString(),
      username: user.username,
      email: user.email,
      area: user.area,
      workOrSchool: user.workOrSchool,
      age: user.age,
      isAdmin: user.isAdmin,
      joinedAt: user.createdAt,
    }));

    res.status(200).json({
      users: formattedUsers,
      pagination: {
        total,
        limit: limitNum,
        skip: skipNum,
      },
    });
  } catch (error) {
    console.error('Admin users error:', error);
    res.status(500).json({ error: 'Failed to load community members' });
  }
};
