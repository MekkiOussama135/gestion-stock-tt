package com.tunisietelecom.gestionstock.service.impl;

import com.tunisietelecom.gestionstock.dto.request.CommandeRequest;
import com.tunisietelecom.gestionstock.dto.response.CommandeResponse;
import com.tunisietelecom.gestionstock.entity.*;
import com.tunisietelecom.gestionstock.enums.CommandeStatus;
import com.tunisietelecom.gestionstock.enums.UserRole;
import com.tunisietelecom.gestionstock.repository.*;
import com.tunisietelecom.gestionstock.service.CommandeService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.tunisietelecom.gestionstock.utils.FormatUtils;
import java.time.LocalDate;
import java.util.List;

@Service
/**
 * Cycle de vie d'une commande fournisseur : création (EN_ATTENTE),
 * livraison (incrémente le Stock Central correspondant) ou annulation.
 */
public class CommandeServiceImpl implements CommandeService {

    private final CommandeRepository commandeRepository;
    private final ProductRepository productRepository;
    private final StockCentralRepository stockCentralRepository;
    private final UserRepository userRepository;
    private final NotificationRepository notificationRepository;

    public CommandeServiceImpl(CommandeRepository commandeRepository,
                               ProductRepository productRepository,
                               StockCentralRepository stockCentralRepository,
                               UserRepository userRepository,
                               NotificationRepository notificationRepository) {
        this.commandeRepository = commandeRepository;
        this.productRepository = productRepository;
        this.stockCentralRepository = stockCentralRepository;
        this.userRepository = userRepository;
        this.notificationRepository = notificationRepository;
    }

    @Override
    public CommandeResponse createCommande(CommandeRequest request) {

        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new RuntimeException("Product not found"));

        Commande commande = new Commande();
        commande.setProduct(product);
        commande.setFournisseur(request.getFournisseur());
        commande.setQuantity(request.getQuantity());
        commande.setStatus(CommandeStatus.EN_COURS);
        commande.setDateCommande(LocalDate.now());
        commande.setDateLivraisonPrevue(request.getDateLivraisonPrevue());

        return toResponse(commandeRepository.save(commande));
    }

    @Override
    public List<CommandeResponse> getAllCommandes() {
        return commandeRepository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public CommandeResponse markAsDelivered(Long id) {

        Commande commande = commandeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Commande not found"));

        if (commande.getStatus() != CommandeStatus.EN_COURS) {
            throw new RuntimeException("This order is not in progress");
        }

        StockCentral stockCentral = stockCentralRepository.findByProductId(commande.getProduct().getId())
                .orElseGet(() -> {
                    StockCentral s = new StockCentral();
                    s.setProduct(commande.getProduct());
                    s.setQuantity(0);
                    return s;
                });

        stockCentral.setQuantity(stockCentral.getQuantity() + commande.getQuantity());
        stockCentralRepository.save(stockCentral);

        commande.setStatus(CommandeStatus.LIVREE);
        commande.setDateLivraisonReelle(LocalDate.now());

        Commande saved = commandeRepository.save(commande);

        String message = String.format("Commande livrée : %s unités de %s (fournisseur : %s).",
                FormatUtils.fmtQty(saved.getQuantity()), saved.getProduct().getName(), saved.getFournisseur());
        for (User admin : userRepository.findByRole(UserRole.ADMIN)) {
            Notification notification = new Notification();
            notification.setUser(admin);
            notification.setMessage(message);
            notificationRepository.save(notification);
        }

        return toResponse(saved);
    }

    @Override
    public CommandeResponse cancelCommande(Long id) {

        Commande commande = commandeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Commande not found"));

        if (commande.getStatus() != CommandeStatus.EN_COURS) {
            throw new RuntimeException("Only in-progress orders can be cancelled");
        }

        commande.setStatus(CommandeStatus.ANNULEE);

        return toResponse(commandeRepository.save(commande));
    }

    private CommandeResponse toResponse(Commande c) {
        CommandeResponse r = new CommandeResponse();
        r.setId(c.getId());
        r.setProductId(c.getProduct().getId());
        r.setProductName(c.getProduct().getName());
        r.setFournisseur(c.getFournisseur());
        r.setQuantity(c.getQuantity());
        r.setStatus(c.getStatus());
        r.setDateCommande(c.getDateCommande());
        r.setDateLivraisonPrevue(c.getDateLivraisonPrevue());
        r.setDateLivraisonReelle(c.getDateLivraisonReelle());
        r.setEnRetard(c.getStatus() == CommandeStatus.EN_COURS
                && LocalDate.now().isAfter(c.getDateLivraisonPrevue()));
        r.setCreatedAt(c.getCreatedAt());
        r.setUpdatedAt(c.getUpdatedAt());
        r.setCreatedBy(c.getCreatedBy());
        r.setUpdatedBy(c.getUpdatedBy());

        return r;
    }
}