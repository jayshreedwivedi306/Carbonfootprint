provider "aws" {
  region = "us-east-1"
}

# --- VPC Infrastructure ---
resource "aws_vpc" "carbon_vpc" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_support   = true
  enable_dns_hostnames = true
  tags = { Name = "carbon-footprint-vpc" }
}

resource "aws_internet_gateway" "gw" {
  vpc_id = aws_vpc.carbon_vpc.id
  tags   = { Name = "carbon-igw" }
}

resource "aws_subnet" "public_1" {
  vpc_id            = aws_vpc.carbon_vpc.id
  cidr_block        = "10.0.1.0/24"
  availability_zone = "us-east-1a"
  map_public_ip_on_launch = true
}

resource "aws_subnet" "public_2" {
  vpc_id            = aws_vpc.carbon_vpc.id
  cidr_block        = "10.0.2.0/24"
  availability_zone = "us-east-1b"
  map_public_ip_on_launch = true
}

resource "aws_subnet" "private_1" {
  vpc_id            = aws_vpc.carbon_vpc.id
  cidr_block        = "10.0.3.0/24"
  availability_zone = "us-east-1a"
}

# --- Managed RDS PostgreSQL Database ---
resource "aws_db_subnet_group" "db_subnets" {
  name       = "carbon-db-subnet-group"
  subnet_ids = [aws_subnet.public_1.id, aws_subnet.public_2.id] # Simple public accessibility group for demonstration
}

resource "aws_security_group" "db_sg" {
  name        = "carbon-db-sg"
  description = "Allow DB connection access"
  vpc_id      = aws_vpc.carbon_vpc.id

  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = ["10.0.0.0/16"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_db_instance" "postgres" {
  allocated_storage      = 20
  engine                 = "postgres"
  engine_version         = "15.4"
  instance_class         = "db.t3.micro"
  db_name                = "carbonfootprint"
  username               = "db_admin"
  password               = "carbon_prod_password_change_me"
  parameter_group_name   = "default.postgres15"
  skip_final_snapshot    = true
  db_subnet_group_name   = aws_db_subnet_group.db_subnets.name
  vpc_security_group_ids = [aws_security_group.db_sg.id]
}

# --- ALB Load Balancer ---
resource "aws_security_group" "alb_sg" {
  name   = "carbon-alb-sg"
  vpc_id = aws_vpc.carbon_vpc.id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_lb" "carbon_alb" {
  name               = "carbon-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb_sg.id]
  subnets            = [aws_subnet.public_1.id, aws_subnet.public_2.id]
}

resource "aws_lb_target_group" "tg" {
  name        = "carbon-tg"
  port        = 80
  protocol    = "HTTP"
  vpc_id      = aws_vpc.carbon_vpc.id
  target_type = "ip"

  health_check {
    path = "/health"
  }
}

resource "aws_lb_listener" "listener" {
  load_balancer_arn = aws_lb.carbon_alb.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.tg.arn
  }
}

# --- ECS Fargate Cluster ---
resource "aws_ecs_cluster" "cluster" {
  name = "carbon-ecs-cluster"
}

# Output API Load Balancer endpoint
output "alb_dns_name" {
  value       = aws_lb.carbon_alb.dns_name
  description = "The public endpoint for CarbonAware application"
}
