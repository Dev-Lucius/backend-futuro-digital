INSERT INTO funcionario (nome, salario, senha, papel) VALUES
('Lucas Oliveira', 2500.00, 'senha123', 1),
('Mariana Santos', 2800.00, 'senha456', 1),
('Pedro Henrique', 2200.00, 'senha789', 1),
('Ana Costa', 3500.00, 'admin123', 2),
('Gabriel Souza', 2400.00, 'senha321', 1);

INSERT INTO produto (descricao, preco, comissao, quantidade) VALUES
('Teclado mecânico', 250.00, 15.00, 20),
('Mouse gamer', 120.00, 8.00, 35),
('Monitor 24 polegadas', 850.00, 50.00, 10),
('Headset USB', 180.00, 12.00, 25),
('Webcam Full HD', 220.00, 14.00, 15),
('SSD 1TB', 450.00, 30.00, 12),
('Memória RAM 16GB', 280.00, 18.00, 18),
('Notebook', 3200.00, 150.00, 5);

INSERT INTO venda (vendedor, produto, quando, quantidade) VALUES
(1, 1, '2026-10-20 09:15:00', 2),
(2, 3, '2026-10-20 10:30:00', 1),
(1, 2, '2026-10-20 11:45:00', 3),
(3, 4, '2026-10-21 14:20:00', 2),
(5, 6, '2026-10-21 15:10:00', 1),
(2, 5, '2026-10-22 09:40:00', 2),
(1, 8, '2026-10-22 13:25:00', 1),
(3, 7, '2026-10-23 10:00:00', 4),
(5, 1, '2026-10-24 16:30:00', 1),
(2, 2, '2026-10-25 11:20:00', 2);

-- Atualizando Papeis
-- Ana Costa será a gerente
UPDATE funcionario
SET papel = 1
WHERE codigo = 4;

-- Os demais funcionários serão vendedores
UPDATE funcionario
SET papel = 2
WHERE codigo IN (1, 2, 3, 5);
