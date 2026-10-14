import {
  createTicket as createTicketService,
  listMyTickets as listMyTicketsService,
  adminListTickets,
  adminUpdateTicket,
} from '../services/supportService.js';

export async function create(req, res, next) {
  try {
    const t = await createTicketService({ userId: req.user.id, ...req.body });
    res.status(201).json({ ticket: t });
  } catch (err) { next(err); }
}

export async function listMine(req, res, next) {
  try {
    const tickets = await listMyTicketsService(req.user.id);
    res.json({ tickets });
  } catch (err) { next(err); }
}

export async function adminList(req, res, next) {
  try {
    const { status, limit, cursor } = req.query;
    const page = await adminListTickets({
      status,
      limit: limit ? Number(limit) : undefined,
      cursor,
    });
    res.json(page);
  } catch (err) { next(err); }
}

export async function adminUpdate(req, res, next) {
  try {
    const t = await adminUpdateTicket({
      ticketId: req.params.id,
      adminId:  req.user.id,
      status:      req.body.status,
      resolution:  req.body.resolution,
    });
    res.json({ ticket: t });
  } catch (err) { next(err); }
}
